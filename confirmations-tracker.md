### **Event Tracker Specification**

### **1. Project Preamble & Goals**

**a. Introduction**
This document specifies an extension to the Prayer Tracker application. The new functionality provides tools to plan, monitor, and track member participation for church events. It moves the app's focus from a purely internal activity (prayer) to an external-facing, goal-oriented one: mobilizing the congregation to invite and secure attendance for key events.

**b. Core Objectives**

- **Goal Setting:** Allow church leadership to set clear, specific confirmation and attendance targets for events at the individual member level.
- **Real-time Tracking:** Provide dashboards that show progress towards event goals, including overall progress, group (bacenta) performance, and individual leaderboards.
- **Clear Distinction:** Differentiate between a "confirmation" (an RSVP or commitment to attend) and "attendance" (a person who physically shows up).
- **Data-driven Mobilization:** Give leaders the data they need to see which groups and individuals are most engaged and where encouragement might be needed.
- **Efficiency:** Automate all roll-up calculations using database triggers to ensure dashboards are fast and always up-to-date.

---

### **2. Core Concepts**

- **Event:** A specific gathering (e.g., "Easter Sunday Service," "Summer Outreach BBQ") with its own name, date, and goals.
- **Confirmation:** A record of a person who has committed to attending an event, secured by a specific church member. This is the primary lead-generation metric.
- **Attendance:** A flag indicating that a confirmed person actually attended the event. This is the final conversion metric.
- **Targets:** Specific, numerical goals for both confirmations and attendance, set at the individual member level for each event. Bacenta and overall event targets are automatically derived from these individual goals.

---

### **3. Database Specification**

This schema is designed to be flexible and efficient, setting targets at the granular member level and using automation to aggregate totals.

#### **a. Tables**

- **`events`**: Stores high-level event details and denormalized grand totals.
- **`event_member_targets`**: The core input table. A junction table where specific confirmation and attendance targets are assigned to each member for each event.
- **`confirmations`**: The transactional table where each individual confirmation is recorded.

```sql
-- EVENT TABLES
CREATE TABLE public.events ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), name text NOT NULL, event_timestamp timestamptz NOT NULL, overall_attendee_target integer, total_confirmations integer NOT NULL DEFAULT 0, total_attendees integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now() );
CREATE TABLE public.event_member_targets ( event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, confirmations_target integer, attendance_target integer, total_confirmations integer NOT NULL DEFAULT 0, total_attendees integer NOT NULL DEFAULT 0, PRIMARY KEY (event_id, member_id) );
CREATE TABLE public.confirmations ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, confirmed_by_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE, first_name text NOT NULL, last_name text, contact_number text, attended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now() );
```

#### **b. The `VIEW` for Bacenta-Level Data**

A `VIEW` is used to provide a clean, aggregated summary of targets and progress for each bacenta. This avoids data duplication and ensures the bacenta totals are always in sync with the individual member data.

```sql
CREATE OR REPLACE VIEW public.event_bacenta_targets_view AS
SELECT emt.event_id, m.bacenta_id, SUM(emt.confirmations_target) AS confirmations_target, SUM(emt.attendance_target) AS attendance_target, SUM(emt.total_confirmations) AS total_confirmations, SUM(emt.total_attendees) AS total_attendees
FROM public.event_member_targets emt
JOIN public.members m ON emt.member_id = m.id
WHERE m.bacenta_id IS NOT NULL
GROUP BY emt.event_id, m.bacenta_id;
```

#### **c. Automation: Trigger & Function**

A single trigger on the `confirmations` table automates all roll-up calculations. Whenever a confirmation is added, updated (e.g., marked as attended), or deleted, this function instantly recalculates and updates the `total_confirmations` and `total_attendees` fields on both the `event_member_targets` and the main `events` tables.

```sql
CREATE OR REPLACE FUNCTION public.update_event_confirmation_totals() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_event_id uuid; target_member_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN target_event_id := OLD.event_id; target_member_id := OLD.confirmed_by_member_id;
  ELSE target_event_id := NEW.event_id; target_member_id := NEW.confirmed_by_member_id;
  END IF;

  -- Update totals for the specific Member
  UPDATE public.event_member_targets SET total_confirmations = (SELECT COUNT(*) FROM public.confirmations WHERE event_id = target_event_id AND confirmed_by_member_id = target_member_id), total_attendees = (SELECT COUNT(*) FROM public.confirmations WHERE event_id = target_event_id AND attended = true AND confirmed_by_member_id = target_member_id) WHERE event_id = target_event_id AND member_id = target_member_id;

  -- Update grand totals for the entire Event
  UPDATE public.events SET total_confirmations = (SELECT COUNT(*) FROM public.confirmations WHERE event_id = target_event_id), total_attendees = (SELECT COUNT(*) FROM public.confirmations WHERE event_id = target_event_id AND attended = true) WHERE id = target_event_id;

  IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- The trigger itself
DROP TRIGGER IF EXISTS on_confirmation_change ON public.confirmations;
CREATE TRIGGER on_confirmation_change AFTER INSERT OR UPDATE OR DELETE ON public.confirmations FOR EACH ROW EXECUTE FUNCTION public.update_event_confirmation_totals();
```

#### **d. RLS Policies**

These policies grant the necessary access for the application to function in its password-less state.

```sql
CREATE POLICY "Allow anon read on event_member_targets" ON public.event_member_targets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon full access on confirmations" ON public.confirmations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read on events" ON public.events FOR SELECT TO anon USING (true);
-- Note: No policy is needed for the VIEW directly. Its security is inherited from the underlying tables.
```

---

### **4. Inferred Application Screens & Flows**

#### **a. Event Dashboard**

- **Purpose:** The main overview screen for a specific event.
- **Features:**
    - Headline stats: `Total Confirmations / Target`, `Total Attendees / Target`.
    - Visual progress bars for both metrics.
    - **Bacenta Leaderboard:** A ranked list of bacentas showing their progress (`confirmations / target` and `attendees / target`). This data comes from the `event_bacenta_targets_view`.
    - **Individual Leaderboard:** A ranked list of the top members based on their `total_confirmations`.

#### **b. Member-Specific View**

- **Purpose:** A personalized view for each church member to see their progress and manage their confirmations.
- **Features:**
    - Clear display of their personal targets: `Your Confirmation Target: X`, `Your Attendance Target: Y`.
    - Their current progress: `You have X confirmations and Y attendees.`
    - A list of the people they have confirmed, with their contact details.
    - A prominent "Add New Confirmation" button.

#### **c. Confirmation Entry Form**

- **Purpose:** A simple form for members to add a new person they have confirmed.
- **Fields:** First Name, Last Name (optional), Contact Number (optional). The `event_id` and `confirmed_by_member_id` are passed automatically.

#### **d. Event Check-in / Attendance Mode**

- **Purpose:** A special UI to be used on the day of the event to mark attendance.
- **Features:**
    - A searchable list of all confirmed guests for the event.
    - A simple toggle or checkbox next to each name.
    - Toggling the checkbox updates the `attended` flag on the `confirmations` table for that person, which automatically triggers the update of all attendance totals.

---

### **5. Final Step for Development**

After applying all database changes, the following command must be run to update the application's TypeScript types:
`npx supabase gen types typescript --linked > app/database.types.ts`

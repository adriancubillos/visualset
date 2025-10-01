# Select Components Documentation

This application uses custom Select components built with Headless UI to provide consistent dropdown behavior with controlled height limits.

## Global Configuration

The maximum height for all dropdown menus is controlled in `/src/config/workshop-properties.ts`:

```typescript
export const UI_CONFIG = {
  SELECT_MAX_HEIGHT: 500, // Change this value to adjust all dropdowns
} as const;
```

## Available Components

### 1. **Select** (`/src/components/ui/Select.tsx`)
**Use for:** Standard dropdowns with optional "None" selection

```tsx
import Select from '@/components/ui/Select';

<Select
  label="Machine"
  value={machineId}
  onChange={setMachineId}
  options={machines} // Array of { id: string, name: string }
  placeholder="-- None --"
/>
```

**Features:**
- Accepts `null` value for "no selection"
- Alphabetically sorted options (use `sortByName()` utility)
- Checkmark indicator for selected item
- Smooth animations

---

### 2. **FilterSelect** (`/src/components/ui/FilterSelect.tsx`)
**Use for:** Filter dropdowns with "All" option

```tsx
import FilterSelect from '@/components/ui/FilterSelect';

<FilterSelect
  label="Project"
  value={selectedProject} // "all" or an ID
  onChange={setSelectedProject}
  options={projects}
  allLabel="All Projects"
/>
```

**Features:**
- Always includes an "All" option (value: "all")
- Perfect for filtering lists
- Used in ScheduleCalendar filters

---

### 3. **ConfigSelect** (`/src/components/ui/ConfigSelect.tsx`)
**Use for:** Configuration-based dropdowns (status, type, etc.)

```tsx
import ConfigSelect from '@/components/ui/ConfigSelect';
import { MACHINE_STATUS } from '@/config/workshop-properties';

<ConfigSelect
  label="Status"
  value={status}
  onChange={setStatus}
  options={MACHINE_STATUS} // Array of { value: string, label: string }
  required
/>
```

**Features:**
- For dropdowns that always have a value (no "None" option)
- Works with config constants from `workshop-properties.ts`
- Used in forms for status, type, shift, etc.

---

### 4. **AssignmentSelect** (`/src/components/forms/AssignmentSelect.tsx`)
**Use for:** Task assignment dropdowns (machine, operator)

```tsx
import AssignmentSelect from '@/components/forms/AssignmentSelect';

<AssignmentSelect
  id="machineId"
  name="machineId"
  label="Machine"
  value={machineId}
  onChange={setMachineId}
  options={machines}
  required
/>
```

**Features:**
- Wraps the base Select component
- Includes hidden input for form submission
- Smart placeholder text based on assignment type
- Auto-sorts options alphabetically

---

### 5. **ProjectItemSelect** (`/src/components/forms/ProjectItemSelect.tsx`)
**Use for:** Linked Project and Item selection

```tsx
import ProjectItemSelect from '@/components/forms/ProjectItemSelect';

<ProjectItemSelect
  projectId={projectId}
  itemId={itemId}
  projects={projects}
  items={items}
  onProjectChange={setProjectId}
  onItemChange={setItemId}
  required
/>
```

**Features:**
- Two linked dropdowns (Project → Item)
- Automatically filters items based on selected project
- Resets item when project changes
- Includes hidden inputs for form submission

---

## Migration Guide

### Replacing Native `<select>` Elements

**Before:**
```tsx
<select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="">-- None --</option>
  {options.map(opt => (
    <option key={opt.id} value={opt.id}>{opt.name}</option>
  ))}
</select>
```

**After:**
```tsx
<Select
  value={value}
  onChange={setValue}
  options={options}
  placeholder="-- None --"
/>
```

### For Filter Dropdowns with "All"

**Before:**
```tsx
<select value={filter} onChange={(e) => setFilter(e.target.value)}>
  <option value="all">All Items</option>
  {options.map(opt => (
    <option key={opt.id} value={opt.id}>{opt.name}</option>
  ))}
</select>
```

**After:**
```tsx
<FilterSelect
  value={filter}
  onChange={setFilter}
  options={options}
  allLabel="All Items"
/>
```

### For Config-Based Dropdowns

**Before:**
```tsx
<select value={status} onChange={(e) => setStatus(e.target.value)}>
  {MACHINE_STATUS.map(s => (
    <option key={s.value} value={s.value}>{s.label}</option>
  ))}
</select>
```

**After:**
```tsx
<ConfigSelect
  value={status}
  onChange={setStatus}
  options={MACHINE_STATUS}
/>
```

---

## Styling

All Select components use consistent styling that matches your application's design system:
- Border: `border-gray-300` or `border-slate-200`
- Focus: Blue ring with `focus:ring-blue-500`
- Hover: Blue background `bg-blue-100`
- Selected: Checkmark icon in blue

---

## Benefits

✅ **Consistent Height**: All dropdowns limited to configured max height with scrolling  
✅ **Better UX**: Smooth animations, hover effects, visual feedback  
✅ **Accessibility**: Keyboard navigation, ARIA labels  
✅ **Maintainability**: Change height globally in one place  
✅ **Type Safety**: Full TypeScript support  
✅ **Mobile Friendly**: Touch-optimized interactions  

---

## Where Applied

- ✅ **TaskModal**: Machine and Operator dropdowns
- ✅ **ScheduleCalendar**: All 4 filter dropdowns (Project, Item, Machine, Operator)
- ✅ **AssignmentSelect**: Used in task forms
- ✅ **ProjectItemSelect**: Used in task forms
- 📝 **Form Pages**: Can be updated to use ConfigSelect for status/type dropdowns

---

## Notes

- Native HTML `<select>` elements cannot have their dropdown menu height styled with CSS
- These custom components use Headless UI's `Listbox` which provides full styling control
- All components automatically sort options alphabetically using the `sortByName()` utility
- The dropdown menu is positioned absolutely and will adjust to viewport boundaries

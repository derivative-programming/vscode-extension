# Working Hours Validation - Visual Examples

## Real-Time Validation Examples

### Example 1: Valid Configuration ✅

```
┌─────────┬───────────┬────────────┬──────────┬───────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours │
├─────────┼───────────┼────────────┼──────────┼───────┤
│ [✓]     │ Monday    │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Blue text, normal borders
│ [✓]     │ Tuesday   │ [08:00 AM] │[04:00 PM]│  8.0  │ ← Valid
│ [✓]     │ Wednesday │ [10:00 AM] │[06:00 PM]│  8.0  │ ← Valid
│ [✓]     │ Thursday  │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Valid
│ [✓]     │ Friday    │ [09:00 AM] │[01:00 PM]│  4.0  │ ← Half day, valid
│ [ ]     │ Saturday  │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled (grayed out)
│ [ ]     │ Sunday    │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled (grayed out)
└─────────┴───────────┴────────────┴──────────┴───────┘

Status: ✅ All valid - can save
```

---

### Example 2: Invalid Time Range ❌

```
┌─────────┬───────────┬────────────┬──────────┬─────────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours   │
├─────────┼───────────┼────────────┼──────────┼─────────┤
│ [✓]     │ Monday    │ [09:00 AM] │[05:00 PM]│  8.0    │ ← Valid
│ [✓]     │ Tuesday   │ [05:00 PM] │[09:00 AM]│ Invalid │ ← RED ERROR!
│         │           │  🔴 RED   │  🔴 RED  │ (red)   │    Red borders, red text
│         │           │  BORDER   │  BORDER  │         │    Error background
│ [✓]     │ Wednesday │ [09:00 AM] │[05:00 PM]│  8.0    │ ← Valid
│ [✓]     │ Thursday  │ [09:00 AM] │[05:00 PM]│  8.0    │ ← Valid
│ [✓]     │ Friday    │ [09:00 AM] │[09:00 AM]│ Invalid │ ← RED ERROR!
│         │           │  🔴 RED   │  🔴 RED  │ (red)   │    Same start/end = invalid
└─────────┴───────────┴────────────┴──────────┴─────────┘

Click Save → ❌ BLOCKED

Error Message:
┌─────────────────────────────────────────────────────┐
│ Working Hours Configuration Errors:                 │
│                                                      │
│ 1. Tuesday: End time must be after start time      │
│ 2. Friday: End time must be after start time       │
└─────────────────────────────────────────────────────┘
```

---

### Example 3: Warning (Long Shift) ⚠️

```
┌─────────┬───────────┬────────────┬──────────┬──────────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours    │
├─────────┼───────────┼────────────┼──────────┼──────────┤
│ [✓]     │ Monday    │ [09:00 AM] │[05:00 PM]│  8.0     │ ← Valid
│ [✓]     │ Tuesday   │ [09:00 AM] │[05:00 PM]│  8.0     │ ← Valid
│ [✓]     │ Wednesday │ [09:00 AM] │[05:00 PM]│  8.0     │ ← Valid
│ [✓]     │ Thursday  │ [09:00 AM] │[05:00 PM]│  8.0     │ ← Valid
│ [✓]     │ Friday    │ [06:00 AM] │[11:00 PM]│ Too Long │ ← ORANGE WARNING!
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │    Orange borders
│         │           │  BORDER   │  BORDER  │          │    Warning background
└─────────┴───────────┴────────────┴──────────┴──────────┘

Click Save → ⚠️ WARNING PROMPT

Confirmation Dialog:
┌─────────────────────────────────────────────────────┐
│ Working Hours Warnings:                             │
│                                                      │
│ 1. Friday: 17.0 hours is unusually long (over 16   │
│    hours)                                           │
│                                                      │
│ Do you want to continue saving?                     │
│                                                      │
│              [Cancel]    [OK]                       │
└─────────────────────────────────────────────────────┘

User can choose:
• Cancel → Go back and edit
• OK → Save anyway (user knows it's unusual)
```

---

### Example 4: All Days Disabled ❌

```
┌─────────┬───────────┬────────────┬──────────┬───────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours │
├─────────┼───────────┼────────────┼──────────┼───────┤
│ [ ]     │ Monday    │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Tuesday   │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Wednesday │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Thursday  │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Friday    │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Saturday  │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
│ [ ]     │ Sunday    │ [09:00 AM] │[05:00 PM]│  8.0  │ ← Disabled
└─────────┴───────────┴────────────┴──────────┴───────┘
     (All rows grayed out - all time inputs disabled)

Click Save → ❌ BLOCKED

Error Message:
┌─────────────────────────────────────────────────────┐
│ Working Hours Configuration Errors:                 │
│                                                      │
│ 1. At least one working day must be enabled        │
└─────────────────────────────────────────────────────┘
```

---

### Example 5: Multiple Warnings ⚠️⚠️

```
┌─────────┬───────────┬────────────┬──────────┬──────────┐
│ Enabled │ Day       │ Start Time │ End Time │ Hours    │
├─────────┼───────────┼────────────┼──────────┼──────────┤
│ [✓]     │ Monday    │ [06:00 AM] │[10:00 PM]│ Too Long │ ← 16 hours = WARNING
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │
│ [✓]     │ Tuesday   │ [06:00 AM] │[10:00 PM]│ Too Long │ ← 16 hours = WARNING
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │
│ [✓]     │ Wednesday │ [06:00 AM] │[10:00 PM]│ Too Long │ ← 16 hours = WARNING
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │
│ [✓]     │ Thursday  │ [06:00 AM] │[10:00 PM]│ Too Long │ ← 16 hours = WARNING
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │
│ [✓]     │ Friday    │ [06:00 AM] │[10:00 PM]│ Too Long │ ← 16 hours = WARNING
│         │           │ 🟠 ORANGE │ 🟠 ORANGE│ (orange) │
└─────────┴───────────┴────────────┴──────────┴──────────┘

Total Weekly Hours: 80.0 hours

Click Save → ⚠️ MULTIPLE WARNINGS

Confirmation Dialog:
┌─────────────────────────────────────────────────────┐
│ Working Hours Warnings:                             │
│                                                      │
│ 1. Monday: 16.0 hours is unusually long (over 16   │
│    hours)                                           │
│ 2. Tuesday: 16.0 hours is unusually long (over 16  │
│    hours)                                           │
│ 3. Wednesday: 16.0 hours is unusually long (over   │
│    16 hours)                                        │
│ 4. Thursday: 16.0 hours is unusually long (over    │
│    16 hours)                                        │
│ 5. Friday: 16.0 hours is unusually long (over 16   │
│    hours)                                           │
│ 6. Total weekly hours (80.0) is very high (over    │
│    80 hours)                                        │
│                                                      │
│ Do you want to continue saving?                     │
│                                                      │
│              [Cancel]    [OK]                       │
└─────────────────────────────────────────────────────┘
```

---

## Color Legend

### Hours Display Colors

| Color | Meaning | Example | Status |
|-------|---------|---------|--------|
| 🔵 **Blue** | Valid hours | `8.0` | ✅ Can save |
| 🔴 **Red** | Invalid range | `Invalid` | ❌ Blocked |
| 🟠 **Orange** | Warning | `Too Long` | ⚠️ Confirm to save |

### Border Colors

| Color | Time Input Styling | Meaning |
|-------|-------------------|---------|
| Normal (gray) | Default border | Valid time range |
| 🔴 **Red** | Error border | End ≤ Start |
| 🟠 **Orange** | Warning border | Hours > 16 |

### Row Background Colors

| Background | Class | Trigger |
|------------|-------|---------|
| Normal | (none) | Valid configuration |
| 🔴 Light red | `.invalid-time-range` | Invalid time range |
| 🟠 Light orange | `.warning-time-range` | Hours > 16 or > 24 |
| Gray | `.disabled-row` | Day not enabled |

---

## Interactive Behavior Timeline

### User Changes End Time from Valid to Invalid

```
Step 1: Initial State (Valid)
Monday: [09:00 AM] → [05:00 PM] = 8.0 (blue) ✅

Step 2: User clicks end time input
Monday: [09:00 AM] → [_____] (editing)

Step 3: User types "08:00 AM"
Monday: [09:00 AM] → [08:00 AM] = Invalid (red) ❌
                      🔴 RED      🔴 RED
                      BORDER      BORDER
           ┌─────────────────────────────────────┐
           │ Row background turns light red      │
           └─────────────────────────────────────┘

Step 4: User tries to save
           ┌─────────────────────────────────────┐
           │ ❌ SAVE BLOCKED                     │
           │                                      │
           │ Error: "Monday: End time must be    │
           │         after start time"           │
           └─────────────────────────────────────┘

Step 5: User fixes time to "05:00 PM"
Monday: [09:00 AM] → [05:00 PM] = 8.0 (blue) ✅
           • Red borders removed
           • Red background removed
           • Blue text restored
           • Can save now ✅
```

---

## Validation Thresholds

### Hours Per Day

| Range | Status | Message | Can Save? |
|-------|--------|---------|-----------|
| ≤ 0 | ❌ Error | "Invalid" | No |
| 0.1 - 16 | ✅ Valid | X.X hours | Yes |
| 16.1 - 24 | ⚠️ Warning | "Too Long" | With confirmation |
| > 24 | ⚠️ Warning | "Too Long" | With confirmation |

### Weekly Total Hours

| Range | Status | Message | Can Save? |
|-------|--------|---------|-----------|
| < 8 | ⚠️ Warning | "Total weekly hours is very low" | With confirmation |
| 8 - 80 | ✅ Valid | (no message) | Yes |
| > 80 | ⚠️ Warning | "Total weekly hours is very high" | With confirmation |

---

## Summary of Visual Feedback

✅ **Valid**: Blue text, normal borders, no background  
❌ **Invalid**: Red text "Invalid", red borders, red background, blocked save  
⚠️ **Warning**: Orange text "Too Long", orange borders, orange background, save with confirmation  
⚪ **Disabled**: Gray, inputs disabled, not included in calculations

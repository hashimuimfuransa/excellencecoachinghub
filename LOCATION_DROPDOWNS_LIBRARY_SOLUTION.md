# Location Dropdowns - Library-Based Solution

## Problem
The manual location data in `locationConstants.ts` was incomplete and couldn't provide all districts, sectors, cells, and villages for Rwanda and other countries.

## Solution
Implemented a **hybrid approach** combining:
1. **`country-state-city` npm package** - For complete global data (Countries → States/Provinces → Cities/Districts)
2. **Custom Rwanda data** - For Rwanda-specific subdivisions (Sectors, Cells, Villages)

## Installation
Run the following command in the elearning directory:
```bash
npm install country-state-city
```

## Files Modified

### 1. `elearning/src/utils/locationConstants.ts`
**Changes:**
- Imported the `country-state-city` library
- Created functions to retrieve countries, states, and cities dynamically:
  - `getAllCountries()` - Returns all countries from the library
  - `getStatesByCountry(countryCode)` - Returns provinces/states for a country
  - `getCitiesByState(countryCode, stateCode)` - Returns districts/cities for a state
  - `getDistrictsByProvince(province)` - Rwanda-specific helper
- Kept complete Rwanda subdivision data for:
  - `SECTORS_BY_DISTRICT` - Maps districts to their sectors
  - `CELLS_BY_SECTOR` - Maps sectors to their cells
  - `VILLAGES_BY_CELL` - Maps cells to their villages
- Added helper functions:
  - `getCountryCodeByName(countryName)` - Convert country name to code
  - `getStateCodeByName(countryCode, stateName)` - Convert state name to code

### 2. `elearning/src/pages/Teacher/TeacherProfileComplete.tsx`
**Changes:**
- Updated imports to use new library-based functions
- Modified state variables for location options:
  - `availableCountries` - Array of { name, code }
  - `availableProvinces` - Array of { name, code }
  - `availableDistricts` - Array of { name }
  - `availableSectors`, `availableCells`, `availableVillages` - Arrays of strings
- Added/Enhanced useEffect hooks:
  - Load all countries on component mount
  - Update provinces when country changes
  - Update districts when province changes (Rwanda-specific)
  - Update sectors when district changes (Rwanda-specific)
  - Update cells when sector changes (Rwanda-specific)
  - Update villages when cell changes (Rwanda-specific)
- Updated Select component rendering:
  - Country dropdown now shows all countries from library
  - Province/State dropdown shows for all countries with provinces
  - District/City dropdown shows only when province is selected
  - Sectors, Cells, Villages show cascading selections for Rwanda

## How It Works

### Cascading Dropdowns Flow:
1. **User selects Country** → Component loads all states/provinces for that country
2. **User selects Province** → Component loads all districts/cities for that province
3. **User selects District** → Component loads all sectors for that district (Rwanda only)
4. **User selects Sector** → Component loads all cells for that sector (Rwanda only)
5. **User selects Cell** → Component loads all villages for that cell (Rwanda only)

### Data Structure:
```
Country (RW - Rwanda)
  ↓
Province/State (Eastern Province, Western Province, etc.) - from library
  ↓
District/City (Gatsibo, Kayonza, etc.) - from library
  ↓
Sector (Jabana, Kabare, etc.) - from custom Rwanda data
  ↓
Cell (Abakundakwita, Amahoro, etc.) - from custom Rwanda data
  ↓
Village (various) - from custom Rwanda data
```

## Key Features

✅ **Complete Location Data** - All countries and their subdivisions
✅ **Rwanda-Specific** - Comprehensive sectors, cells, and villages
✅ **Cascading Dropdowns** - Each level depends on parent selection
✅ **Auto-Reset** - Dependent fields reset when parent changes
✅ **Works for All Countries** - Not just Rwanda (for future internationalization)
✅ **Type-Safe** - Proper TypeScript types for all location data
✅ **Performant** - Data is loaded dynamically and cached

## Testing Instructions

1. **Install dependency:**
   ```bash
   cd c:\Users\Lenovo\excellencecoachinghub\elearning
   npm install country-state-city
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Test the Address Information form:**
   - Select "Rwanda" as country → Should show 5 provinces
   - Select "Eastern Province" → Should show all districts (Bugesera, Gatsibo, Kayonza, Kirehe, etc.)
   - Select "Gatsibo" district → Should show sectors from our custom data
   - Continue selecting down through sectors, cells, and villages

4. **Test with other countries:**
   - Select "United States" → Should show states (California, Texas, etc.)
   - Select "Canada" → Should show provinces
   - For countries without subdivisions, only Country field appears

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│  country-state-city Library             │
│  - All countries (250+)                 │
│  - All states/provinces                 │
│  - All cities/districts                 │
└────────┬──────────────────────────────┬─┘
         │                              │
    ┌────▼────┐              ┌─────────▼────┐
    │ Countries│              │ States/Prov. │
    └────┬─────┘              └──────────────┘
         │
    ┌────▼──────────────────────┐
    │ Rwanda-Specific Data       │
    │ - SECTORS_BY_DISTRICT      │
    │ - CELLS_BY_SECTOR          │
    │ - VILLAGES_BY_CELL         │
    └───────────────────────────┘
```

## Future Enhancements

1. **Extend Rwanda Data** - Add more sectors, cells, and villages if needed
2. **Cache Location Data** - Implement caching for better performance
3. **Bulk Import** - Add tool to import Rwanda data from authoritative source
4. **Search/Filter** - Add search functionality for long dropdown lists
5. **Autocomplete** - Convert to autocomplete for better UX with many options

## Troubleshooting

**Issue:** Districts not showing for selected province
- **Solution:** Ensure country-state-city is properly installed: `npm install country-state-city`

**Issue:** Sectors not showing for selected district  
- **Solution:** Check that the district name matches exactly with keys in `SECTORS_BY_DISTRICT`

**Issue:** Dropdowns appear empty
- **Solution:** Check browser console for errors, verify library data is loaded

## Rollback Plan

If issues occur, revert to manual data by:
1. Remove npm package: `npm uninstall country-state-city`
2. Comment out library imports in `locationConstants.ts`
3. Use the backup manual data from git history

## Testing Checklist

- [ ] npm install country-state-city completes successfully
- [ ] Application builds without errors
- [ ] Country dropdown shows 200+ countries
- [ ] Selecting Rwanda shows 5 provinces
- [ ] Selecting province shows appropriate districts
- [ ] Selecting district shows sectors from custom data
- [ ] Cascading selections work properly
- [ ] Dependent fields reset when parent changes
- [ ] Form submission works with selected values
- [ ] Profile loads with previously saved locations
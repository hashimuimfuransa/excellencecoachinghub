/**
 * Location Constants - Rwanda Only
 * Uses 'rwanda-geo-structure' npm package for Rwanda administrative hierarchy
 * Provides: Provinces → Districts → Sectors → Cells → Villages
 */

import {
  getProvinces as getProvincesFromPackage,
  getDistrictsByProvince as getDistrictsByProvinceFromPackage,
  getSectorsByDistrict as getSectorsByDistrictFromPackage,
  getCellsBySector as getCellsBySectorFromPackage,
  getVillagesByCell as getVillagesByCellFromPackage
} from 'rwanda-geo-structure';

/**
 * Get Rwanda provinces
 * @returns Array of province objects
 */
export const getProvincesData = () => {
  try {
    const provinces = getProvincesFromPackage();
    console.log('[DEBUG] getProvincesData:', provinces);
    
    if (!Array.isArray(provinces)) {
      console.warn('[WARN] getProvincesFromPackage() did not return array');
      return [];
    }
    
    return provinces.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[ERROR] getProvincesData error:', error);
    return [];
  }
};

/**
 * Get province names as strings
 * @returns Array of province names
 */
export const getProvinceNames = (): string[] => {
  try {
    const provinces = getProvincesFromPackage();
    
    console.log('[DEBUG] getProvinceNames: Raw provinces from package:', provinces);
    console.log('[DEBUG] getProvinceNames: Type:', typeof provinces);
    console.log('[DEBUG] getProvinceNames: Is array?', Array.isArray(provinces));
    
    if (!Array.isArray(provinces)) {
      console.warn('[WARN] getProvinceNames: Not an array');
      return [];
    }
    
    console.log('[DEBUG] getProvinceNames: Number of provinces:', provinces.length);
    
    const mapped = provinces.map((p: any) => {
      console.log('[DEBUG] getProvinceNames: Province object:', p, 'Type:', typeof p);
      if (typeof p === 'string') {
        return p;
      }
      return p.name || p.id || String(p);
    })
    .filter((name: any) => name && name !== 'undefined');
    
    console.log('[DEBUG] getProvinceNames: Mapped provinces:', mapped);
    
    return mapped.sort();
  } catch (error) {
    console.error('[ERROR] getProvinceNames error:', error);
    return [];
  }
};

/**
 * Get districts for a Rwanda province
 * @param provinceName Province name
 * @returns Array of district names
 */
export const getDistrictsByProvinceName = (provinceName: string): string[] => {
  try {
    if (!provinceName || provinceName.trim() === '') {
      console.log('[DEBUG] getDistrictsByProvinceName: Province is empty');
      return [];
    }
    
    console.log(`[DEBUG] getDistrictsByProvinceName called with: "${provinceName}"`);
    
    const districts = getDistrictsByProvinceFromPackage(provinceName);
    
    console.log(`[DEBUG] getDistrictsByProvinceName: Raw districts from package:`, districts);
    console.log(`[DEBUG] getDistrictsByProvinceName: Is array?`, Array.isArray(districts));
    
    if (!Array.isArray(districts)) {
      console.warn(`[WARN] getDistrictsByProvinceName did not return array for "${provinceName}"`);
      return [];
    }
    
    console.log(`[DEBUG] getDistrictsByProvinceName: Number of districts:`, districts.length);
    
    const districtNames = districts.map((d: any) => {
      console.log(`[DEBUG] getDistrictsByProvinceName: District object:`, d, 'Type:', typeof d);
      if (typeof d === 'string') {
        return d;
      }
      return d.name || d.id || String(d);
    })
    .filter((name: any) => name && name !== 'undefined')
    .sort();
    
    console.log(`[DEBUG] getDistrictsByProvinceName: Found ${districtNames.length} districts for "${provinceName}":`, districtNames);
    return districtNames;
  } catch (error) {
    console.error(`[ERROR] getDistrictsByProvinceName error for "${provinceName}":`, error);
    return [];
  }
};

/**
 * Get sectors for a Rwanda district
 * @param provinceName Province name
 * @param districtName District name
 * @returns Array of sector names
 */
export const getSectorsByDistrictName = (provinceName: string, districtName: string): string[] => {
  try {
    if (!provinceName || provinceName.trim() === '' || !districtName || districtName.trim() === '') {
      console.log('[DEBUG] getSectorsByDistrictName: Empty province or district');
      return [];
    }
    
    console.log(`[DEBUG] getSectorsByDistrictName called with: "${provinceName}" / "${districtName}"`);
    
    const sectors = getSectorsByDistrictFromPackage(provinceName, districtName);
    
    console.log(`[DEBUG] getSectorsByDistrictName: Raw sectors from package:`, sectors);
    console.log(`[DEBUG] getSectorsByDistrictName: Is array?`, Array.isArray(sectors));
    
    if (!Array.isArray(sectors)) {
      console.warn(`[WARN] getSectorsByDistrictName did not return array for "${provinceName}/${districtName}"`);
      return [];
    }
    
    console.log(`[DEBUG] getSectorsByDistrictName: Number of sectors:`, sectors.length);
    
    const sectorNames = sectors.map((s: any) => {
      console.log(`[DEBUG] getSectorsByDistrictName: Sector object:`, s, 'Type:', typeof s);
      if (typeof s === 'string') {
        return s;
      }
      return s.name || s.id || String(s);
    })
    .filter((name: any) => name && name !== 'undefined')
    .sort();
    
    console.log(`[DEBUG] getSectorsByDistrictName: Found ${sectorNames.length} sectors for "${provinceName}/${districtName}":`, sectorNames);
    return sectorNames;
  } catch (error) {
    console.error(`[ERROR] getSectorsByDistrictName error for "${provinceName}/${districtName}":`, error);
    return [];
  }
};

/**
 * Get cells for a Rwanda sector
 * @param provinceName Province name
 * @param districtName District name
 * @param sectorName Sector name
 * @returns Array of cell names
 */
export const getCellsBySectorName = (provinceName: string, districtName: string, sectorName: string): string[] => {
  try {
    if (!provinceName || provinceName.trim() === '' || !districtName || districtName.trim() === '' || !sectorName || sectorName.trim() === '') {
      console.log('[DEBUG] getCellsBySectorName: Empty province, district, or sector');
      return [];
    }
    
    console.log(`[DEBUG] getCellsBySectorName called with: "${provinceName}" / "${districtName}" / "${sectorName}"`);
    
    const cells = getCellsBySectorFromPackage(provinceName, districtName, sectorName);
    
    console.log(`[DEBUG] getCellsBySectorName: Raw cells from package:`, cells);
    console.log(`[DEBUG] getCellsBySectorName: Is array?`, Array.isArray(cells));
    
    if (!Array.isArray(cells)) {
      console.warn(`[WARN] getCellsBySectorName did not return array for "${provinceName}/${districtName}/${sectorName}"`);
      return [];
    }
    
    console.log(`[DEBUG] getCellsBySectorName: Number of cells:`, cells.length);
    
    const cellNames = cells.map((c: any) => {
      console.log(`[DEBUG] getCellsBySectorName: Cell object:`, c, 'Type:', typeof c);
      if (typeof c === 'string') {
        return c;
      }
      return c.name || c.id || String(c);
    })
    .filter((name: any) => name && name !== 'undefined')
    .sort();
    
    console.log(`[DEBUG] getCellsBySectorName: Found ${cellNames.length} cells for "${provinceName}/${districtName}/${sectorName}":`, cellNames);
    return cellNames;
  } catch (error) {
    console.error(`[ERROR] getCellsBySectorName error for "${provinceName}/${districtName}/${sectorName}":`, error);
    return [];
  }
};

/**
 * Get villages for a Rwanda cell
 * @param provinceName Province name
 * @param districtName District name
 * @param sectorName Sector name
 * @param cellName Cell name
 * @returns Array of village names
 */
export const getVillagesByCellName = (provinceName: string, districtName: string, sectorName: string, cellName: string): string[] => {
  try {
    if (!provinceName || provinceName.trim() === '' || !districtName || districtName.trim() === '' || !sectorName || sectorName.trim() === '' || !cellName || cellName.trim() === '') {
      console.log('[DEBUG] getVillagesByCellName: Empty province, district, sector, or cell');
      return [];
    }
    
    console.log(`[DEBUG] getVillagesByCellName called with: "${provinceName}" / "${districtName}" / "${sectorName}" / "${cellName}"`);
    
    const villages = getVillagesByCellFromPackage(provinceName, districtName, sectorName, cellName);
    
    console.log(`[DEBUG] getVillagesByCellName: Raw villages from package:`, villages);
    console.log(`[DEBUG] getVillagesByCellName: Is array?`, Array.isArray(villages));
    
    if (!Array.isArray(villages)) {
      console.warn(`[WARN] getVillagesByCellName did not return array for "${provinceName}/${districtName}/${sectorName}/${cellName}"`);
      return [];
    }
    
    console.log(`[DEBUG] getVillagesByCellName: Number of villages:`, villages.length);
    
    const villageNames = villages.map((v: any) => {
      console.log(`[DEBUG] getVillagesByCellName: Village object:`, v, 'Type:', typeof v);
      if (typeof v === 'string') {
        return v;
      }
      return v.name || v.id || String(v);
    })
    .filter((name: any) => name && name !== 'undefined')
    .sort();
    
    console.log(`[DEBUG] getVillagesByCellName: Found ${villageNames.length} villages for "${provinceName}/${districtName}/${sectorName}/${cellName}":`, villageNames);
    return villageNames;
  } catch (error) {
    console.error(`[ERROR] getVillagesByCellName error for "${provinceName}/${districtName}/${sectorName}/${cellName}":`, error);
    return [];
  }
};

/**
 * Validate a complete location object
 * @param location Location object to validate
 * @returns true if required fields are valid
 */
export const validateRwandaLocation = (location: {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}): boolean => {
  if (!location.province) return false;
  if (!location.district) return false;
  return true;
};

export const getProvinces = getProvinceNames;
export const getDistrictsByProvince = getDistrictsByProvinceName;
export const getSectorsByDistrict = getSectorsByDistrictName;
export const getCellsBySector = getCellsBySectorName;
export const getVillagesByCell = getVillagesByCellName;


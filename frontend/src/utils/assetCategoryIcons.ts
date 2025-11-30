import {
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiServer,
  FiPrinter,
  FiHardDrive,
  FiHeadphones,
  FiVideo,
  FiCpu,
  FiPackage,
} from 'react-icons/fi';
import {
  MdLaptop,
  MdMouse,
  MdKeyboard,
  MdPhonelink,
} from 'react-icons/md';

/**
 * Get icon component for asset category
 * @param {string} category - Asset category name
 * @returns {Component} React icon component
 */
export const getCategoryIcon = (category) => {
  const categoryIcons = {
    laptop: MdLaptop,
    desktop: FiMonitor,
    monitor: FiMonitor,
    mobile: FiSmartphone,
    phone: FiSmartphone,
    tablet: FiTablet,
    server: FiServer,
    network: FiServer,
    printer: FiPrinter,
    accessory: FiHardDrive,
    headset: FiHeadphones,
    webcam: FiVideo,
    dock: MdPhonelink, // USB-C dock connector icon
    keyboard: MdKeyboard,
    mouse: MdMouse,
    other: FiPackage,
  };

  return categoryIcons[category?.toLowerCase()] || FiPackage;
};

/**
 * Get icon component for asset status
 * @param {string} status - Asset status
 * @returns {Component} React icon component
 */
export const getStatusIcon = (status) => {
  const statusIcons = {
    available: FiPackage,
    assigned: FiSmartphone,
    maintenance: FiHardDrive,
    retired: FiPrinter,
    disposed: FiHardDrive,
  };

  return statusIcons[status?.toLowerCase()] || FiPackage;
};

/**
 * Get icon component for manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Component} React icon component
 */
export const getManufacturerIcon = (manufacturer) => {
  const manufacturerLower = manufacturer?.toLowerCase() || '';
  
  if (manufacturerLower.includes('lenovo')) return FiMonitor;
  if (manufacturerLower.includes('dell')) return FiMonitor;
  if (manufacturerLower.includes('hp')) return FiMonitor;
  if (manufacturerLower.includes('apple')) return FiMonitor;
  if (manufacturerLower.includes('microsoft')) return FiTablet;
  if (manufacturerLower.includes('samsung')) return FiMonitor;
  
  return FiServer;
};

export default {
  getCategoryIcon,
  getStatusIcon,
  getManufacturerIcon,
};


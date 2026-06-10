/**
 * api/doctors.js — backward-compat shim.
 * All functions re-exported from api/providers.js.
 * @deprecated Import from api/providers.js directly.
 */
export {
  getProviders,
  getProvider,
  getProviderSlots,
  getBusinessCategories,
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyWorkingHours  as getMySchedule,
  createWorkingHours as createSchedule,
  deleteWorkingHours as deleteSchedule,
  getMyTimeOffs      as getMyExceptions,
  createTimeOff      as createException,
  deleteTimeOff      as deleteException,
} from './providers'

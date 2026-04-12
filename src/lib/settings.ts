import { unstable_noStore as noStore } from 'next/cache'
import { dbConnect } from '@/lib/db'
import Setting from '@/models/Setting'

type StoreSettings = {
  maintenanceMode?: boolean
}

export async function getStoreSettings() {
  noStore()
  await dbConnect()

  return Setting.findOne({}).lean<StoreSettings | null>()
}

export async function isMaintenanceModeEnabled() {
  const settings = await getStoreSettings()
  return Boolean(settings?.maintenanceMode)
}

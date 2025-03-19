import PageBreadcrumb from "../components/common/PageBreadCrumb"
import PageMeta from "../components/common/PageMeta"
import { useAuth } from "./AuthPages/AuthContext"
import { useState, useEffect } from "react"
import { Mail, Phone, User, MapPin, Briefcase, Shield } from "lucide-react"

export default function UserProfiles() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch by mounting after first render
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-t-transparent border-brand-600 animate-spin dark:border-brand-400 dark:border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Extract initials from email (before @)
  const initials = user.email ? user.email.charAt(0).toUpperCase() : "U"

  return (
    <>
      <PageMeta title={`${initials} - User Profile`} description="User Profile Details" />
      <PageBreadcrumb pageTitle={"Profile"} />

      <div className="space-y-6">
        {/* User Profile Card */}
        <UserMetaCard initials={initials} email={user.email} role={user.role} />

        {/* User Information Card */}
        <UserInfoCard email={user.email} role={user.role} />
      </div>
    </>
  )
}

/** ✅ User Info Card - Personal Details */
function UserInfoCard({ email, role }: { email: string; role: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
        <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
          <User className="mr-2 h-5 w-5 text-brand-600 dark:text-brand-400" />
          Personal Information
        </h4>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-100 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-brand-900/50">
            <p className="mb-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
              <Mail className="mr-2 h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              EMAIL ADDRESS
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">{email}</p>
          </div>

          <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-100 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-brand-900/50">
            <p className="mb-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
              <Shield className="mr-2 h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              ROLE
            </p>
            <p className="flex items-center text-sm font-medium capitalize text-gray-800 dark:text-white">
              <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              {role}
            </p>
          </div>

          <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-100 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-brand-900/50">
            <p className="mb-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
              <Phone className="mr-2 h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              PHONE
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">+91 XXX-XXX-XXXX</p>
          </div>

          <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-100 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-brand-900/50">
            <p className="mb-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
              <Briefcase className="mr-2 h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              BIO
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">Team Member</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** ✅ User Meta Card - Profile Picture & Name */
function UserMetaCard({ initials, email, role }: { initials: string; email: string; role: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="relative h-32 bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-800 dark:to-brand-700">
        <div className="absolute -bottom-12 left-6 flex items-end">
          <div className="h-24 w-24 overflow-hidden rounded-xl border-4 border-white bg-gradient-to-br from-brand-100 to-brand-50 shadow-lg dark:border-gray-800 dark:from-brand-900 dark:to-brand-800">
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-700 dark:text-brand-300">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 pb-6 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">{email}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-800 dark:bg-brand-900/50 dark:text-brand-300">
                <Shield className="mr-1 h-3 w-3" />
                {role}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <MapPin className="mr-1 h-3 w-3" />
                Surat, India
              </span>
            </div>
          </div>

       
        </div>
      </div>
    </div>
  )
}


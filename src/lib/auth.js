export function getUserRole(user) {
  return user?.app_metadata?.role ?? 'user'
}

export function isAdmin(user) {
  return getUserRole(user) === 'admin'
}
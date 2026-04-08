const API_BASE = import.meta.env.VITE_API_BASE_URL

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data.data
}

// Create employee + start workflow
export const createEmployee = (body) =>
  request('/employees', { method: 'POST', body: JSON.stringify(body) })

// Get all employees (HR dashboard)
export const listEmployees = () => request('/employees')

// Get single employee progress
export const getProgress = (employeeId) =>
  request(`/employees/${employeeId}/progress`)

// Get presigned S3 upload URL
export const getUploadUrl = (employeeId, body) =>
  request(`/employees/${employeeId}/documents/upload-url`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

// Upload file directly to S3 via presigned URL
export const uploadToS3 = async (uploadUrl, file) => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error('S3 upload failed')
}

// Record policy sign-off for an employee
export const submitPolicySignoff = (employeeId) =>
  request(`/employees/${employeeId}/policy-signoff`, { method: 'PUT' })

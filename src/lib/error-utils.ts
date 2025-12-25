/**
 * Maps technical error messages to user-friendly messages
 * Prevents exposure of implementation details in the UI
 */
export function getClientErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error || "");
  
  // Database errors
  if (msg.includes("unique constraint") || msg.includes("duplicate key")) {
    return "This information already exists. Please use different values.";
  }
  if (msg.includes("not found") || msg.includes("PGRST116")) {
    return "The requested resource was not found.";
  }
  if (msg.includes("permission denied") || msg.includes("RLS") || msg.includes("row-level security")) {
    return "You do not have permission to perform this action.";
  }
  if (msg.includes("foreign key") || msg.includes("violates")) {
    return "This action cannot be completed due to related data.";
  }
  
  // Auth errors
  if (msg.includes("JWT") || msg.includes("token")) {
    return "Your session has expired. Please sign in again.";
  }
  if (msg.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (msg.includes("User already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (msg.includes("Password")) {
    return "Password must be at least 6 characters long.";
  }
  if (msg.includes("email")) {
    return "Please enter a valid email address.";
  }
  
  // Network errors
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  if (msg.includes("timeout") || msg.includes("Timeout")) {
    return "Request timed out. Please try again.";
  }
  
  // Rate limiting
  if (msg.includes("rate limit") || msg.includes("Too many requests")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  // AI service errors (keep these user-friendly messages as they're already safe)
  if (msg.includes("Service temporarily unavailable") || 
      msg.includes("Too many requests") ||
      msg.includes("max") ||
      msg.includes("too long")) {
    return msg;
  }
  
  // Generic fallback
  return "An error occurred. Please try again.";
}

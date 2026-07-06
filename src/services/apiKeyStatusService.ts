import { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../utils/api";

export interface ApiKeyStatus {
  hasApiKey: boolean;
  isExpired: boolean | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  approvalStatus: "pending" | "approved" | "rejected" | "auto-approved" | null;
  isActive: boolean;
  needsApproval: boolean;
  needsRegeneration: boolean;
  environment?: string;
  label?: string;
  message: string;
}

/**
 * Check API key status (expiration, approval, etc.)
 * @param apiInstance - Axios instance with authentication configured
 * @returns Promise<ApiKeyStatus>
 */
export const checkApiKeyStatus = async (
  apiInstance: AxiosInstance
): Promise<ApiKeyStatus> => {
  try {
    const response = await apiInstance.get<ApiKeyStatus>(
      API_ENDPOINTS.CHECK_API_KEY_STATUS
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "[apiKeyStatusService] Error checking API key status:",
      error
    );
    // Return default status on error
    return {
      hasApiKey: false,
      isExpired: null,
      expiresAt: null,
      daysUntilExpiry: null,
      approvalStatus: null,
      isActive: false,
      needsApproval: false,
      needsRegeneration: false,
      message: "Unable to check API key status",
    };
  }
};

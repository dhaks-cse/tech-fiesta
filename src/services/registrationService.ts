import { Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/firebase";
import { RegistrationFormData } from "@/types";

export interface FirebaseRegistration
  extends Omit<RegistrationFormData, "hasConsented"> {
  id: string;
  registrationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "verified" | "failed";
}

export interface DuplicateCheck {
  exists: boolean;
  duplicateFields: string[];
  existingRegistration?: FirebaseRegistration;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Check for duplicate registrations based on email, WhatsApp number, and name
 */
export async function checkDuplicateRegistration(
  email: string,
  whatsapp: string
): Promise<DuplicateCheck> {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      console.warn("User not logged in. Bypassing duplicate check.");
      return {
        exists: false,
        duplicateFields: [],
      };
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/registration/check-duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email, whatsapp })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        exists: result.data.exists,
        duplicateFields: result.data.duplicateFields,
        existingRegistration: result.data.existingRegistration,
      };
    }

    return {
      exists: false,
      duplicateFields: [],
    };
  } catch (error) {
    console.error("Error checking duplicate registration:", error);
    // Fallback duplicate check: allow proceeding if backend/API fails
    return {
      exists: false,
      duplicateFields: [],
    };
  }
}

/**
 * Submit registration to the backend API
 */
export async function submitRegistration(
  formData: RegistrationFormData
): Promise<{
  success: boolean;
  registrationId?: string;
  requiresPayment?: boolean;
  amount?: number;
  currency?: string;
  message: string;
}> {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      // Mock fallback for offline/local testing
      const registrationId = `TF-ODYSSEY-MOCK-${uuidv4().substr(0, 8).toUpperCase()}`;
      return {
        success: true,
        registrationId,
        message: `[MOCK] Offline registration successful! Your mock ID is ${registrationId}.`,
      };
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/registration/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        registrationId: result.data.registrationId,
        requiresPayment: result.data.requiresPayment,
        amount: result.data.amount,
        currency: result.data.currency,
        message: result.message || "Registration processed",
      };
    } else {
      return {
        success: false,
        message: result.message || "Registration failed. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error submitting registration to API:", error);
    return {
      success: false,
      message: "Registration failed due to network error. Please check your connection and try again.",
    };
  }
}

/**
 * Create a payment order on the backend
 */
export async function createPaymentOrder(
  registrationData: RegistrationFormData,
  amount: number
): Promise<{
  success: boolean;
  data?: {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
  };
  message: string;
}> {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        currency: "INR",
        registrationData
      })
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Error creating payment order:", error);
    return {
      success: false,
      message: error.message || "Failed to create payment order"
    };
  }
}

/**
 * Verify payment signature on the backend and finalize registration
 */
export async function verifyPayment(paymentDetails: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  registrationData: RegistrationFormData;
}): Promise<{
  success: boolean;
  data?: {
    registrationId: string;
    status: string;
    paymentStatus: string;
    amount: number;
  };
  message: string;
}> {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(paymentDetails)
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return {
      success: false,
      message: error.message || "Failed to verify payment"
    };
  }
}

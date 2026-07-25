"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Event, RegistrationFormData, TeamMember, PaymentQR, SelectedItem } from "@/types";
import { events } from "@/data/events";
import { workshops } from "@/data/workshops";
import { validateEmail, validatePhone } from "@/utils/registration"

import { CheckCircle, MapPin, Plus  } from "lucide-react";
import { submitRegistration, checkDuplicateRegistration, createPaymentOrder, verifyPayment } from "@/services/registrationService";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";  
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


import { downloadRegistrationPDF, downloadRegistrationText, downloadRegistrationJSON, RegistrationDownloadData } from "@/utils/downloadUtils";

interface RegistrationFormProps {
  selectedEvents?: SelectedItem[];
  selectedWorkshops?: SelectedItem[];
  selectedNonTechEvents?: SelectedItem[];
  onUpdateEvents?: (events: SelectedItem[]) => void;
  onUpdateWorkshops?: (workshops: SelectedItem[]) => void;
  onUpdateNonTechEvents?: (nonTechEvents: SelectedItem[]) => void;
  onClearCart?: () => void;
}

export default function RegistrationForm({
  selectedEvents = [],
  selectedWorkshops = [],
  selectedNonTechEvents = [],
  onUpdateEvents,
  onUpdateWorkshops,
  onUpdateNonTechEvents,
  onClearCart,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    department: "",
    email: "",
    whatsapp: "",
    college: "",
    year: "",
    isTeamEvent: false,
    teamSize: 1,
    teamMembers: [],
    selectedEvents: selectedEvents,
    selectedWorkshops: selectedWorkshops,
    selectedNonTechEvents: selectedNonTechEvents,
    transactionIds: {},
    hasConsented: false,
    selectedPass: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [successData, setSuccessData] = useState<{
    registrationId: string;
    formData: RegistrationFormData;
    submissionDate: string;
  } | null>(null);
   const [techFiestaPass, setTechFiestaPass] = useState(false);

  // Payment QR data - Free entry, individual QRs for each event/workshop
  const generatePaymentQRs = (): PaymentQR[] => {
    return []; // Payments disabled for now
  };

  // Get tech and non-tech events
  const techEvents = events.filter(event => event.type === "tech");
  const nonTechEvents = events.filter(event => event.type === "non-tech");

  const calculateTotalPrice = () => {
    let total = 0;
    const hasPass = formData.selectedPass !== null && formData.selectedPass !== undefined;
    
    if (!hasPass) {
      // Tech events
      formData.selectedEvents.forEach((se) => {
        const event = events.find((e) => e.id === se.id);
        if (event && event.price) {
          total += parseInt(event.price.replace("₹", ""));
        } else {
          total += 70;
        }
      });
      
      // Workshops
      formData.selectedWorkshops.forEach((sw) => {
        const workshop = workshops.find((w) => w.id === sw.id);
        if (workshop && workshop.price) {
          total += parseInt(workshop.price.replace("₹", ""));
        } else {
          total += 101;
        }
      });
      
      // Non-tech events
      formData.selectedNonTechEvents.forEach((se) => {
        const event = events.find((e) => e.id === se.id);
        if (event && event.price) {
          total += parseInt(event.price.replace("₹", ""));
        } else {
          total += 50;
        }
      });
    } else {
      // Pass selected
      const prices: number[] = [];
      
      formData.selectedEvents.forEach((se) => {
        const event = events.find((e) => e.id === se.id);
        if (event && event.price) {
          prices.push(parseInt(event.price.replace("₹", "")));
        } else {
          prices.push(70);
        }
      });
      
      formData.selectedWorkshops.forEach((sw) => {
        const workshop = workshops.find((w) => w.id === sw.id);
        if (workshop && workshop.price) {
          prices.push(parseInt(workshop.price.replace("₹", "")));
        } else {
          prices.push(101);
        }
      });
      
      formData.selectedNonTechEvents.forEach((se) => {
        const event = events.find((e) => e.id === se.id);
        if (event && event.price) {
          prices.push(parseInt(event.price.replace("₹", "")));
        } else {
          prices.push(50);
        }
      });
      
      prices.sort((a, b) => b - a);
      
      total = 149;
      
      if (prices.length > 3) {
        const extraPrices = prices.slice(3);
        total += extraPrices.reduce((sum, p) => sum + p, 0);
      }
    }
    
    return total;
  };

  const totalPrice = calculateTotalPrice();

  // Check if any selected events require teams and get the maximum/minimum team size allowed
  const getTeamRequirements = () => {
    const selectedEventsWithTeamLimits = [...formData.selectedEvents, ...formData.selectedNonTechEvents]
      .map(selectedEvent => events.find(e => e.id === selectedEvent.id))
      .filter((event): event is Event => event !== undefined && event.maxTeamSize !== undefined);

    const allTeamEvents = selectedEventsWithTeamLimits;
    
    // Only count as team events if the maxTeamSize is > 1
    const actualTeamEvents = allTeamEvents.filter(event => event.maxTeamSize! > 1);
    
    if (actualTeamEvents.length === 0) {
      return { requiresTeam: false, maxTeamSize: 1, minTeamSize: 1 };
    }

    // Get the minimum maxTeamSize among selected events (most restrictive)
    const maxTeamSize = Math.min(...actualTeamEvents.map(event => event.maxTeamSize!));
    
    // Get the maximum minTeamSize among selected events (most restrictive / highest minimum)
    const minTeamSize = Math.max(...actualTeamEvents.map(event => event.minTeamSize || 1));
    
    const hasConflict = minTeamSize > maxTeamSize;
    
    return { requiresTeam: true, maxTeamSize, minTeamSize, hasConflict };
  };

  const teamRequirements = getTeamRequirements();

  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedEvents }));
  }, [selectedEvents]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedWorkshops }));
  }, [selectedWorkshops]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedNonTechEvents }));
  }, [selectedNonTechEvents]);

  useEffect(() => {
    if (teamRequirements.requiresTeam) {
      const minSize = teamRequirements.minTeamSize;
      const maxSize = teamRequirements.maxTeamSize;
      
      // Determine new team size
      let newTeamSize = formData.teamSize || 1;
      if (newTeamSize < minSize) {
        newTeamSize = minSize;
      } else if (newTeamSize > maxSize) {
        newTeamSize = maxSize;
      }
      
      // Adjust teamMembers array to match newTeamSize - 1
      const requiredMemberCount = newTeamSize - 1;
      let newTeamMembers = [...(formData.teamMembers || [])];
      
      if (newTeamMembers.length < requiredMemberCount) {
        // Add empty members
        const diff = requiredMemberCount - newTeamMembers.length;
        for (let i = 0; i < diff; i++) {
          newTeamMembers.push({ name: "", department: "", year: "", email: "", whatsapp: "" });
        }
      } else if (newTeamMembers.length > requiredMemberCount) {
        // Truncate excess members
        newTeamMembers = newTeamMembers.slice(0, requiredMemberCount);
      }
      
      setFormData(prev => ({
        ...prev,
        isTeamEvent: true,
        teamSize: newTeamSize,
        teamMembers: newTeamMembers
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        isTeamEvent: false,
        teamSize: 1,
        teamMembers: []
      }));
    }
  }, [teamRequirements.requiresTeam, teamRequirements.maxTeamSize, teamRequirements.minTeamSize]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventSelection = (eventId: number, type: "event" | "workshop" | "non-tech") => {
    if (type === "event") {
      const event = techEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const isSelected = formData.selectedEvents.some(item => item.id === eventId);
      const newSelection = isSelected
        ? formData.selectedEvents.filter(item => item.id !== eventId)
        : [...formData.selectedEvents, { id: event.id, title: event.title }];
      setFormData(prev => ({ ...prev, selectedEvents: newSelection }));
      onUpdateEvents?.(newSelection);
    } else if (type === "workshop") {
      const workshop = workshops.find(w => w.id === eventId);
      if (!workshop) return;
      
      const isSelected = formData.selectedWorkshops.some(item => item.id === eventId);
      const newSelection = isSelected
        ? formData.selectedWorkshops.filter(item => item.id !== eventId)
        : [...formData.selectedWorkshops, { id: workshop.id, title: workshop.title }];
      setFormData(prev => ({ ...prev, selectedWorkshops: newSelection }));
      onUpdateWorkshops?.(newSelection);
    } else {
      const event = nonTechEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const isSelected = formData.selectedNonTechEvents.some(item => item.id === eventId);
      const newSelection = isSelected
        ? formData.selectedNonTechEvents.filter(item => item.id !== eventId)
        : [...formData.selectedNonTechEvents, { id: event.id, title: event.title }];
      setFormData(prev => ({ ...prev, selectedNonTechEvents: newSelection }));
      onUpdateNonTechEvents?.(newSelection);
    }
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...(formData.teamMembers || [])];
    if (!updatedMembers[index]) {
      updatedMembers[index] = { name: "", department: "", year: "", email: "", whatsapp: "" };
    }
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData(prev => ({ ...prev, teamMembers: updatedMembers }));
  };

  const addTeamMember = () => {
    const currentTeamSize = formData.teamSize || 1;
    const maxAllowedSize = teamRequirements.maxTeamSize;
    
    if (currentTeamSize >= maxAllowedSize) {
      toast.error(`Maximum team size for selected events is ${maxAllowedSize} members.`, { duration: 4000 });
      return;
    }
    
    const newMember: TeamMember = { name: "", department: "", year: "", email: "", whatsapp: "" };
    setFormData(prev => ({
      ...prev,
      teamMembers: [...(prev.teamMembers || []), newMember],
      teamSize: (prev.teamSize || 1) + 1
    }));
  };

  const removeTeamMember = (index: number) => {
    const currentTeamSize = formData.teamSize || 1;
    if (currentTeamSize <= teamRequirements.minTeamSize) {
      toast.error(`Minimum team size for selected events is ${teamRequirements.minTeamSize} members.`, { duration: 4000 });
      return;
    }
    setFormData(prev => ({
      ...prev,
      teamMembers: (prev.teamMembers || []).filter((_, i) => i !== index),
      teamSize: Math.max(1, (prev.teamSize || 1) - 1)
    }));
  };

  const getRequiredQRs = () => {
    return []; // Payments disabled
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Basic validations
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.whatsapp.trim()) newErrors.whatsapp = "WhatsApp number is required";
    else if (!validatePhone(formData.whatsapp)) newErrors.whatsapp = "Invalid phone number format";
    if (!formData.college.trim()) newErrors.college = "College name is required";
    if (!formData.year) newErrors.year = "Year of study is required";
    
    // Event selection validation - at least one event or workshop must be selected
    const totalSelections = formData.selectedEvents.length + formData.selectedWorkshops.length + formData.selectedNonTechEvents.length;
    if (totalSelections === 0) {
      newErrors.events = "Please select at least one event or workshop to register";
    }
      
    // Team member validation
    if (formData.isTeamEvent && formData.teamMembers) {
      if (teamRequirements.hasConflict) {
        newErrors.teamConflict = "Conflicting team size limits detected. Please register for these events separately.";
      }
      
      const currentTeamSize = formData.teamSize || 1;
      if (currentTeamSize < teamRequirements.minTeamSize && !teamRequirements.hasConflict) {
        newErrors.teamSize = `Team size must be at least ${teamRequirements.minTeamSize} members for selected events`;
      }
      if (currentTeamSize > teamRequirements.maxTeamSize) {
        newErrors.teamSize = `Team size cannot exceed ${teamRequirements.maxTeamSize} members for selected events`;
      }
      
      formData.teamMembers.forEach((member, index) => {
        if (!member.name.trim()) newErrors[`team_${index}_name`] = `Team member ${index + 2} name is required`;
        if (!member.email.trim()) newErrors[`team_${index}_email`] = `Team member ${index + 2} email is required`;
        else if (!validateEmail(member.email)) newErrors[`team_${index}_email`] = `Invalid email for team member ${index + 2}`;
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hasConsented) {
      toast.error("Please consent to the terms and conditions");
      return;
    }
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setIsCheckingDuplicates(true);
      const duplicateCheck = await checkDuplicateRegistration(
        formData.email,
        formData.whatsapp,
      );
      
      setIsCheckingDuplicates(false);
      
      if (duplicateCheck.exists) {
        toast.error(
          `Registration already exists with the same ${duplicateCheck.duplicateFields.join(', ')}. Please use different details.`,
          { duration: 6000 }
        );
        setIsSubmitting(false);
        return;
      }
      
      const result = await submitRegistration(formData);
      
      if (result.success) {
        if (result.requiresPayment) {
          toast.loading("Initiating secure payment gateway...", { id: "payment-toast" });
          
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            toast.error("Failed to load Razorpay SDK. Please check your internet connection.", { id: "payment-toast" });
            setIsSubmitting(false);
            return;
          }
          
          const orderResponse = await createPaymentOrder(formData, result.amount || 0);
          if (!orderResponse.success || !orderResponse.data) {
            toast.error(orderResponse.message || "Failed to create payment order", { id: "payment-toast" });
            setIsSubmitting(false);
            return;
          }
          
          const { orderId, amount, currency, key } = orderResponse.data;
          
          toast.dismiss("payment-toast");
          
          // Always use standard Razorpay checkout inline options directly on the page
          const options = {
            key: key,
            amount: amount,
            currency: currency,
            name: "Tech Fiesta 2026",
            description: "Registration Fee",
            image: "/tech_fiesta_odyssey.png",
            order_id: orderId,
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.whatsapp,
            },
            notes: {
              college: formData.college,
              department: formData.department,
            },
            theme: {
              color: "#DC2626",
            },
            handler: async function (response: any) {
              setIsSubmitting(true);
              toast.loading("Verifying payment transaction...", { id: "verification-toast" });
              
              try {
                const verificationResult = await verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  registrationData: formData,
                });
                
                toast.dismiss("verification-toast");
                
                if (verificationResult.success && verificationResult.data) {
                  const eventCount = formData.selectedEvents.length + formData.selectedWorkshops.length + formData.selectedNonTechEvents.length;
                  
                  setSuccessData({
                    registrationId: verificationResult.data.registrationId,
                    formData: { ...formData },
                    submissionDate: new Date().toLocaleString()
                  });
                  
                  toast.success(
                    `Payment verified & registered! Events: ${eventCount}. Confirmation email will be sent to: ${formData.email}.`,
                    { duration: 8000 }
                  );
                  onClearCart?.();
                } else {
                  toast.error(verificationResult.message || "Payment verification failed. Please contact support.");
                }
              } catch (verificationError) {
                console.error("Payment verification error:", verificationError);
                toast.dismiss("verification-toast");
                toast.error("An error occurred during payment verification. Please contact support.");
              } finally {
                setIsSubmitting(false);
              }
            },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
                toast.error("Payment cancelled by user.");
              },
            },
          };
          
          const rzp = new (window as any).Razorpay(options);
          
          rzp.on("payment.failed", function (response: any) {
            console.error("Payment failed:", response.error);
            setIsSubmitting(false);
            toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
          });
          
          rzp.open();
          setIsSubmitting(false);
        } else {
          const eventCount = formData.selectedEvents.length + formData.selectedWorkshops.length + formData.selectedNonTechEvents.length;
          
          setSuccessData({
            registrationId: result.registrationId || "",
            formData: { ...formData },
            submissionDate: new Date().toLocaleString()
          });
          
          toast.success(
            `Successfully registered! Events registered: ${eventCount}. Confirmation email will be sent to: ${formData.email}.`,
            { duration: 8000 }
          );
          onClearCart?.();
          setIsSubmitting(false);
        }
      } else {
        toast.error(result.message, { duration: 6000 });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Registration submission error:", error);
      toast.error("Registration failed. Please try again.");
      setIsSubmitting(false);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Download functions
  const handleDownloadPDF = () => {
    if (!successData) return;
    const downloadData: RegistrationDownloadData = {
      ...successData.formData,
      registrationId: successData.registrationId,
      submissionDate: successData.submissionDate
    };
    downloadRegistrationPDF(downloadData);
    toast.success("Registration PDF downloaded successfully!", { duration: 3000 });
  };

  const handleDownloadText = () => {
    if (!successData) return;
    const downloadData: RegistrationDownloadData = {
      ...successData.formData,
      registrationId: successData.registrationId,
      submissionDate: successData.submissionDate
    };
    downloadRegistrationText(downloadData);
    toast.success("Registration text file downloaded successfully!", { duration: 3000 });
  };

  const handleDownloadJSON = () => {
    if (!successData) return;
    const downloadData: RegistrationDownloadData = {
      ...successData.formData,
      registrationId: successData.registrationId,
      submissionDate: successData.submissionDate
    };
    downloadRegistrationJSON(downloadData);
    toast.success("Registration JSON file downloaded successfully!", { duration: 3000 });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      department: "",
      email: "",
      whatsapp: "",
      college: "",
      year: "",
      isTeamEvent: false,
      teamSize: 1,
      teamMembers: [],
      selectedEvents: [],
      selectedWorkshops: [],
      selectedNonTechEvents: [],
      transactionIds: {},
      hasConsented: false,
      selectedPass: null,
    });
    setErrors({});
    setSuccessData(null);
    setTechFiestaPass(false);
    onClearCart?.();
    toast.success("Form reset! You can now submit a new registration.", { duration: 3000 });
  };

  return (
    <div className="w-full py-2">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 font-[family-name:var(--font-bebas-neue)] tracking-wider text-center text-white">
            Registration Center
          </h2>
          <p className="text-xl sm:text-2xl font-semibold text-red-500 mb-4 font-mono tracking-widest uppercase text-center">
            // SECURING ENTRY PROTOCOL
          </p>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto px-2 text-center font-mono tracking-wide mb-8">
            Register for events and workshops to cement your legacy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 w-full">
          {/* Personal Information */}
          <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center font-[family-name:var(--font-bebas-neue)] tracking-wider">
              <span className="break-words">Personal Information</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.name ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Department *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Science, Electronics, etc."
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.department ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
                {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department}</p>}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.email ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210 or 9876543210"
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.whatsapp ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                />
                {errors.whatsapp && <p className="text-red-400 text-sm mt-1">{errors.whatsapp}</p>}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">College Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your college/university name"
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.college ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.college}
                  onChange={(e) => handleInputChange("college", e.target.value)}
                />
                {errors.college && <p className="text-red-400 text-sm mt-1">{errors.college}</p>}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Year of Study *</label>
                <select
                  required
                  className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-lg text-white focus:outline-none focus:border-red-500 focus:bg-white/10 focus:shadow-[0_0_8px_rgba(239,68,68,0.12)] transition-all duration-300 ${
                    errors.year ? 'border-red-500/60 shadow-[0_0_6px_rgba(239,68,68,0.08)]' : 'border-red-500/20'
                  }`}
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                >
                  <option value="" className="text-gray-400 bg-black">Select Year</option>
                  <option value="1st" className="text-white bg-black">1st Year</option>
                  <option value="2nd" className="text-white bg-black">2nd Year</option>
                  <option value="3rd" className="text-white bg-black">3rd Year</option>
                  <option value="4th" className="text-white bg-black">4th Year</option>
                  <option value="Postgraduate" className="text-white bg-black">Postgraduate</option>
                </select>
                {errors.year && <p className="text-red-400 text-sm mt-1">{errors.year}</p>}
              </div>
            </div>
          </div>

          {/* Event Selection */}
          <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2 font-[family-name:var(--font-bebas-neue)] tracking-wider">
              <span className="break-words">Select Events & Workshops</span>
            </h3>
            {errors.events && <p className="text-red-400 text-sm mb-4">{errors.events}</p>}
            
            {/* Technical Events */}
            <div className="space-y-4 w-full">
              <h4 className="text-lg font-semibold text-red-500 mb-4 flex flex-wrap items-center gap-2 font-mono">
                <span className="break-words">// TECHNICAL_EVENTS</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {techEvents.map(event => (
                  <label key={event.id} className="group relative flex items-start space-x-3 p-4 bg-black/55 border border-red-500/20 rounded-xl hover:bg-red-500/5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/50 w-full overflow-hidden">
                    <input
                      type="checkbox"
                      checked={formData.selectedEvents.some(item => item.id === event.id)}
                      onChange={() => handleEventSelection(event.id, "event")}
                      className="w-5 h-5 text-red-600 bg-black/40 border border-red-500/30 rounded focus:ring-red-500/50 focus:ring-offset-black flex-shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-medium group-hover:text-red-300 transition-colors break-words">{event.title}</span>
                        {event.maxTeamSize && (
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded whitespace-nowrap">
                            {event.maxTeamSize === 1
                              ? "Solo"
                              : event.minTeamSize && event.minTeamSize === event.maxTeamSize
                              ? `Team: ${event.maxTeamSize}`
                              : `Team: ${event.minTeamSize || 1} - ${event.maxTeamSize}`}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm flex flex-wrap items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words">{event.venue}</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Workshops */}
            <div className="space-y-4 w-full">
              <h4 className="text-lg font-semibold text-red-500 my-4 flex flex-wrap items-center gap-2 font-mono">
                <span className="break-words">// WORKSHOPS</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {workshops.map(workshop => (
                  <label key={workshop.id} className="group relative flex items-start space-x-3 p-4 bg-black/55 border border-red-500/20 rounded-xl hover:bg-red-500/5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/50 w-full overflow-hidden">
                    <input
                      type="checkbox"
                      checked={formData.selectedWorkshops.some(item => item.id === workshop.id)}
                      onChange={() => handleEventSelection(workshop.id, "workshop")}
                      className="w-5 h-5 text-red-600 bg-black/40 border border-red-500/30 rounded focus:ring-red-500/50 focus:ring-offset-black flex-shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium group-hover:text-red-300 transition-colors block break-words">{workshop.title}</span>
                      <p className="text-gray-400 text-sm flex flex-wrap items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words">{workshop.venue}</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Non-Tech Events */}
            <div className="space-y-4 w-full">
              <h4 className="text-lg font-semibold text-amber-500 my-4 flex flex-wrap items-center gap-2 font-mono">
                <span className="break-words">// NON_TECHNICAL_EVENTS</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {nonTechEvents.map(event => (
                  <label key={event.id} className="group relative flex items-start space-x-3 p-4 bg-black/55 border border-red-500/20 rounded-xl hover:bg-red-500/5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/50 w-full overflow-hidden">
                    <input
                      type="checkbox"
                      checked={formData.selectedNonTechEvents.some(item => item.id === event.id)}
                      onChange={() => handleEventSelection(event.id, "non-tech")}
                      className="w-5 h-5 text-amber-600 bg-black/40 border border-red-500/30 rounded focus:ring-red-500/50 focus:ring-offset-black flex-shrink-0 mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-medium group-hover:text-amber-300 transition-colors break-words">{event.title}</span>
                        {event.maxTeamSize && (
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded whitespace-nowrap">
                            {event.maxTeamSize === 1
                              ? "Solo"
                              : event.minTeamSize && event.minTeamSize === event.maxTeamSize
                              ? `Team: ${event.maxTeamSize}`
                              : `Team: ${event.minTeamSize || 1} - ${event.maxTeamSize}`}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm flex flex-wrap items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words">{event.venue}</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Team Details */}
          {formData.isTeamEvent && (
            <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-bebas-neue)] tracking-wider">Team Details</h3>
                <div className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
                  Team size: {teamRequirements.minTeamSize > 1 ? `${teamRequirements.minTeamSize} - ` : ""}{teamRequirements.maxTeamSize} members
                </div>
              </div>
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">
                  {teamRequirements.hasConflict ? (
                    <>
                      <strong>Conflicting Team Requirements:</strong> You have selected events with incompatible team size limits. For example, one event requires a minimum of {teamRequirements.minTeamSize} members, while another allows a maximum of {teamRequirements.maxTeamSize} members. 
                      <br /><br />
                      Since all events in a single registration share the same team, you cannot register for these conflicting events together. Please remove the conflicting events and register for them in a separate form submission.
                    </>
                  ) : teamRequirements.minTeamSize > 1 ? (
                    <>
                      <strong>Team Required:</strong> The selected events require team participation. 
                      Please add your team members below (including yourself, minimum {teamRequirements.minTeamSize} and max {teamRequirements.maxTeamSize} total).
                    </>
                  ) : (
                    <>
                      <strong>Team Optional:</strong> The selected events allow you to participate in a team. 
                      You can go solo or add up to {teamRequirements.maxTeamSize - 1} team members below (max {teamRequirements.maxTeamSize} total).
                    </>
                  )}
                </p>
              </div>
              
              {errors.teamConflict && <p className="text-red-400 text-sm mb-4 font-semibold">{errors.teamConflict}</p>}

              {!teamRequirements.hasConflict && (
                <div className="space-y-4">
                  {(formData.teamMembers || []).map((member, index) => (
                  <div key={index} className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-red-500/20 w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium">Team Member {index + 2}</h4>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Name"
                        className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/5 transition-all duration-300"
                        value={member.name}
                        onChange={(e) => handleTeamMemberChange(index, "name", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/5 transition-all duration-300"
                        value={member.department}
                        onChange={(e) => handleTeamMemberChange(index, "department", e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/5 transition-all duration-300"
                        value={member.email}
                        onChange={(e) => handleTeamMemberChange(index, "email", e.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp"
                        className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/5 transition-all duration-300"
                        value={member.whatsapp}
                        onChange={(e) => handleTeamMemberChange(index, "whatsapp", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addTeamMember}
                  disabled={(formData.teamSize || 1) >= teamRequirements.maxTeamSize}
                  className={`w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-102 shadow-[0_4px_12px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center`}
                >
                  {(formData.teamSize || 1) >= teamRequirements.maxTeamSize 
                    ? `Team limit reached (${teamRequirements.maxTeamSize} max)`
                    : '+ Add Team Member'
                  }
                </button>
              </div>
              )}
            </div>
          )}

          {/* Registration Summary */}
          {(formData.selectedEvents.length > 0 || formData.selectedWorkshops.length > 0 || formData.selectedNonTechEvents.length > 0) && (
            <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center font-[family-name:var(--font-bebas-neue)] tracking-wider">
                <span className="break-words">Registration Summary</span>
              </h3>
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Tech Events */}
                {formData.selectedEvents.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-500/35 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-semibold text-red-500 mb-3 font-mono">// TECH_EVENTS ({formData.selectedEvents.length})</h4>
                    <ul className="space-y-2">
                      {formData.selectedEvents.map(selectedEvent => (
                        <li key={selectedEvent.id} className="text-sm text-white break-words">• {selectedEvent.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Workshops */}
                {formData.selectedWorkshops.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-500/35 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-semibold text-red-500 mb-3 font-mono">// WORKSHOPS ({formData.selectedWorkshops.length})</h4>
                    <ul className="space-y-2">
                      {formData.selectedWorkshops.map(selectedWorkshop => (
                        <li key={selectedWorkshop.id} className="text-sm text-white break-words">• {selectedWorkshop.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Non-Tech Events */}
                {formData.selectedNonTechEvents.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-amber-500/35 hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-semibold text-amber-500 mb-3 font-mono">// NON_TECH_EVENTS ({formData.selectedNonTechEvents.length})</h4>
                    <ul className="space-y-2">
                      {formData.selectedNonTechEvents.map(selectedEvent => (
                        <li key={selectedEvent.id} className="text-sm text-white break-words">• {selectedEvent.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Cost breakdown & Total */}
              <div className="mt-6 pt-6 border-t border-red-500/25">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-gray-300 text-sm font-mono">
                    {formData.selectedPass ? (
                      <div>
                        <span className="text-red-400 font-bold">Tech Fiesta Combo Pass Applied (₹149)</span>
                        <span className="text-gray-400 block text-xs mt-1">
                          Covers up to 3 of your selected events/workshops.
                          {((formData.selectedEvents.length + formData.selectedWorkshops.length + formData.selectedNonTechEvents.length) > 3) && (
                            <span className="text-amber-400"> (Extra items charged at standard rates)</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <p>Individual ticket pricing applied</p>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-mono">TOTAL ESTIMATED COST:</span>
                    <span className="text-3xl font-bold text-white font-[family-name:var(--font-bebas-neue)] tracking-wider">
                      ₹{totalPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SPECIAL PASS ================= */}

<div className="mt-8 rounded-2xl overflow-hidden border border-red-500/25 bg-gradient-to-br from-[#180606] via-[#0d0505] to-black shadow-[0_0_30px_rgba(220,38,38,0.18)]">

  {/* Animated Shine */}
  <div className="relative overflow-hidden">

    <div className="absolute inset-0">
      <div className="absolute -left-40 top-0 h-full w-32 rotate-12 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-[shine_5s_linear_infinite]" />
    </div>

    <div className="relative p-5">

      <div className="flex items-center justify-between">

        {/* Left */}
        <div>

          <p className="text-[11px] uppercase tracking-[4px] text-red-400 font-mono">
            SPECIAL PASS
          </p>

          <h3 className="mt-1 text-2xl font-bold text-white">
            Tech Fiesta Pass
          </h3>

          <p className="mt-2 text-sm text-gray-400 max-w-sm">
            Includes <span className="text-red-400 font-semibold">any 3 registrations</span>
            <br />
            (Events, Workshops or a Mix of both)
          </p>

        </div>

        {/* Premium Vertical Barcode */}
<div className="hidden md:flex items-center rounded-lg border border-red-500/20 bg-black/30 px-3 py-3 backdrop-blur-sm">

  <div className="flex gap-[2px]">

    {[2,4,2,3,5,2,4,2,3,2,5,2,4,3,2,5].map((w, i) => (
      <div
        key={i}
        style={{ width: `${w}px` }}
        className="h-[92px] rounded-full bg-gradient-to-b from-red-100 via-red-400 to-red-700"
      />
    ))}

  </div>

  <div className="ml-3 flex flex-col items-center">
    <span className="text-[9px] tracking-[2px] text-red-400 [writing-mode:vertical-rl] rotate-180 font-mono">
      TECHFIESTA2026
    </span>
  </div>

</div>
</div>

      {/* Bottom */}

      <div className="mt-5 flex items-center justify-between">

        <div>

          <p className="text-3xl font-bold text-red-400">
            ₹149
          </p>

          <p className="text-xs text-gray-500">
            One Pass • Three Registrations
          </p>

        </div>

        {!techFiestaPass ? (

          <button
            type="button"
            onClick={() => {
              setTechFiestaPass(true);
              handleInputChange("selectedPass", 1);
            }}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Pass
          </button>

        ) : (

          <button
            type="button"
            onClick={() => {
              setTechFiestaPass(false);
              handleInputChange("selectedPass", null);
            }}
            className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-500/15 px-5 py-2.5 font-semibold text-green-400 transition hover:bg-green-500/20"
          >
            <CheckCircle className="h-4 w-4" />
            Pass Added
          </button>

        )}

      </div>

    </div>

  </div>

</div>

          {/* Consent */}
          <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
            <label className="flex items-start space-x-4 cursor-pointer">
              <input
                type="checkbox"
                className="w-6 h-6 text-red-600 bg-black/40 border border-red-500/35 rounded focus:ring-red-500/50 mt-1 flex-shrink-0 cursor-pointer"
                checked={formData.hasConsented}
                onChange={(e) => handleInputChange("hasConsented", e.target.checked)}
              />
              <div className="text-gray-300 leading-relaxed break-words">
                <p className="font-medium text-white mb-2 font-mono">// DATA_CONSENT_&_VERIFICATION</p>
                <p className="text-sm text-gray-400">
                  I hereby confirm that all the information provided above is <span className="text-red-400 font-medium">accurate and complete</span>. 
                  I understand that any false information may lead to <span className="text-red-400 font-medium">disqualification</span> from the events. 
                  I consent to the processing of my personal data for registration and event management purposes in accordance with privacy guidelines.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="text-center w-full">
            <button
              type="submit"
              disabled={!formData.hasConsented || isSubmitting || isCheckingDuplicates || successData !== null}
              className="w-full max-w-md mx-auto py-3 bg-red-600 text-white font-bold text-base rounded-xl hover:bg-red-700 transition-all duration-200 transform hover:scale-105 shadow-[0_2px_8px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_12px_rgba(220,38,38,0.25)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isCheckingDuplicates ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking details...
                </>
              ) : isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Registration...
                </>
              ) : successData ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Registration Submitted!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Registration {totalPrice > 0 ? `(₹${totalPrice})` : ''}
                </>
              )}
            </button>
          </div>

          {/* Download Section - Show after successful registration */}
          {successData && (
            <div className="bg-black/85 border border-red-500/20 backdrop-blur-sm shadow-[0_1px_8px_rgba(220,38,38,0.07)] rounded-2xl p-4 sm:p-6 w-full overflow-hidden transition-all duration-300">
              <h3 className="text-xl sm:text-2xl font-bold text-red-500 mb-4 flex items-center font-[family-name:var(--font-bebas-neue)] tracking-wider">
                <CheckCircle className="w-6 h-6 mr-3" />
                Registration Successful!
              </h3>
              
              <div className="text-center mb-6 font-mono">
                <p className="text-white text-lg mb-2">
                  <span className="font-semibold text-gray-400">Registration ID:</span> 
                  <span className="text-red-500 font-bold ml-2">{successData.registrationId}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  Submitted on: {successData.submissionDate}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/10">
                <h4 className="text-white font-semibold mb-3 text-center font-mono">// DOWNLOAD_DETAILS</h4>
                <p className="text-gray-400 text-sm text-center mb-4">
                  Save your registration receipt details locally. Choose format:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF Document
                  </button>
                  
                  <button
                    onClick={handleDownloadText}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Text File
                  </button>
                  
                  <button
                    onClick={handleDownloadJSON}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    JSON Data
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={resetForm}
                  className="py-2.5 px-6 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                >
                  Start New Registration
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

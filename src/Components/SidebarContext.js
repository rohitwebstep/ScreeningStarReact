import React, { createContext, useState, useEffect, useContext } from "react";
import {
  FcUpload,
  FcConferenceCall,
  FcCustomerSupport,
  FcManager,
  FcMoneyTransfer,
  FcBusinessman,
  FcApproval,
  FcSalesPerformance,
  FcFile,
  FcDatabase,
  FcInspection,
  FcDocument,
  FcServices,
  FcPackage,
  FcCalendar,
  FcDataSheet,
  FcKey,
  FcTimeline,
  FcBriefcase,
  FcBarChart,
  FcPortraitMode,
  FcNightPortrait,

} from "react-icons/fc"; // Added icons

// Create a context for managing sidebar state
const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const [activeTab, setActiveTab] = useState(null); // To manage active tab sections
  const [sectionTabs, setSectionTabs] = useState([]);

  const employeeTabs = [

        { name: "Create User",  key: "createUser", href: "/admin-createUser" },
        { name: "Existing User",  key: "existingUser", href: "/admin-existing-users" },
        { name: "Permission Manager",  key: "PermissionManager", href: "/admin-PermissionManager" }
  ];

  const documenttabs =[
    {
      name: "APPLICATION DOCUMENT",
      key: "Documents",
      href: "/admin-documents",
    }
  ]
  const leaveManagement =[
    {
      name: "Leave Management",
      key: "leaveManagement",
      href: "/admin-LeaveManagement",
    }
  ]
  const clientTabs = [
    {
      name: "Client Onboarding",
      key: "clientOnboarding",
      href: "/admin-add-new-client",
    },
    {
      name: "Account Management",
      key: "accountManagement",
      href: "/admin-client-spoc",
      subMenu: [
        {
          name: "Client Spoc",
          key: "clientSpoc",
          href: "/admin-client-spoc",
        },
        {
          name: "Escalation Manager",
          key: "escalationManager",
          href: "/admin-escalation-manager",
        },
        {
          name: "Billing Spoc",
          key: "billingSpoc",
          href: "/admin-billing-spoc",
        },
        {
          name: "Billing Escalation",
          key: "billingEscalation",
          href: "/admin-billing-esclation",
        },
        {
          name: "Authorized Details",
          key: "authorizedDetails",
          href: "/admin-authorized-details",
        },
      ],
    },
    {
      name: "Active Accounts",
      key: "activeAccounts",
      href: "/admin-active-account",
    },
    {
      name: "Inactive Clients",
      key: "inactiveClients",
      href: "/admin-inactive-clients",
    },
    {
      name: "Service Management",
      key: "serviceManagement",
      href: "/admin-service-management"
    },
    {
      name: "Service Management Group",
      key: "serviceManagementGroup",
      href: "/admin-service-management-group"
    },
    {
      name: "Package Management",
      key: "packageManagement",
      href: "/admin-package-management"
    },
  ];


  const invoiceTabs = [

    {
      name: "Generate Invoice",
      key: "generateInvoice",
      href: "/admin-generate-invoice"
    },
    {
      name: "Records & Trackers",
      key: "recordsAndTrackers",
      href: "/admin-records-and-trackers"
    },
    {
      name: "Invoice Master ",
      key: "enterSaleData",
      href: "/admin-invoice-master"
    },
    
  ];

  const clientCredential = [
    {
      name: "Client Credentials",
     
      key: "enterSaleData",
      href: "/admin-client-credentials"
    }
  ];
  const adminManager = [
    {
      name: "Admin Manager",
      key: "adminManager",
      href: "/admin-admin-manager"
    },
  ];
  const dataManagement = [
    {
      name: "Data Management",
      key: "dataManagement",
      href: "/admin-data-management"
    },
  ];

  const adminTabs = [
    {
      name: "Application Status",
      key: "applicationStatus",
      href: "/admin-application-status"
    },
    {
      name: "PREPARE REPORT",
      key: "reportGeneration",
      href: "/admin-prepare-report"
    },
    // {
    //   name: "QC STATUS",
    //   key: "qcStatus",
    //   href: "/"
    // }
  ];
  
  const ServiceReportFormsTab = [
    {
      name: "Service Report Form",
      key: "ServiceReportForms",
      href: "/admin-ServiceReportForm"
    },
    {
      name: "Generate Report Service Form",
      key: "GenerateReportServiceForm",
      href: "/admin-GenerateReportServiceForm"
    }
    // {
    //   name: "Modules",
    //   key: "Modules",
    //   href: "/admin-Modules"
    // }
    ,
    // {
    //   name: "Report Generation",
    //   key: "reportGeneration",
    //   href: "/admin-prepare-report"
    // },
    // {
    //   name: "QC STATUS",
    //   key: "qcStatus",
    //   href: "/"
    // }
  ];
  const CaseAllocationTab = [
    {
      name: "Case Allocation",
      key: "CaseAllocation",
      href: "/admin-CaseAllocation"
    },
    {
      name: "Case Allocation List",
      key: "CaseAllocationList",
      href: "/admin-CaseAllocationList"
    }

  ];
  const HumanResourceMenu = [
    {
      name: "Human Resource Menu",
      key: "HumanResourceMenu",
      href: "/admin-HumanResourceMenu"
    },
  ];
  

  const tatReminder = [
    {
      name: "TAT Reminder",
      key: "tatReminder",
      href: "/admin-tat-reminder"
    }
  ]
  const userHistory = [
    {
      name: "User History",
      key: "userHistory",
      href: "/admin-user-history"
    }
  ]
  const acknowledgement = [
    {
      name: "Acknowledgement",
      key: "acknowledgement",
      href: "/admin-acknowledgement"
    }
  ]
  const adminCandidateManager = [
    {
      name: "Candidate Manager",
      key: "adminCandidateManager",
      href: "/admin-candidate-manager"
    }
  ]
  const createadminticket = [
    {
      name: "TICKETS",
      key: "createTickets",
      href: "/admin-createTicket"
    }
  ]
  const teamManagement = [
    {
      name: "Team Management",
      key: "teamManagement",
      href: "/admin-team-management"
    }
  ]
  const seeMore = [
    // {
    //   name: "DASHBOARD",
    //   key: "dashboard",
    //   href: "/",
    //   button: true // Indicating that this tab is rendered as a button
    // }
    // {
    //   name: "Employee Credentials",
    //   key: "createUser",
    //   href: "/admin-createUser",
    //   subMenu: [
    //     { name: "Create User",  key: "createUser", href: "/admin-createUser" },
    //     { name: "Existing User",  key: "existingUser", href: "/admin-existing-users" },
    //     { name: "Permission Manager",  key: "PermissionManager", href: "/admin-PermissionManager" }

    //   ]
    // },
    // {
    //   name: "Billing Dashboard",
    //   key: "generateInvoice",
    //   href: "/admin-generate-invoice",
    //   subMenu: [
    //     {
    //       name: "Generate Invoice",
    //       key: "generateInvoice",
    //       href: "/admin-generate-invoice"
    //     },
    //     {
    //       name: "Records & Trackers",
    //       key: "recordsAndTrackers",
    //       href: "/admin-records-and-trackers"
    //     },
    //     {
    //       name: "Invoice Master ",
    //       key: "enterSaleData",
    //       href: "/admin-invoice-master"
    //     }
    //   ]
    // },
    // {
    //   name: "User History",
    //   key: "userHistory",
    //   href: "/admin-user-history"
    // },


    // {
    //   name: "Admin Manager",
    //   key: "adminManager",
    //   href: "/admin-admin-manager"
    // },
    // {
    //   name: "TAT Reminder",
    //   key: "tatReminder",
    //   href: "/admin-tat-reminder"
    // },
    // {
    //   name: "Acknowledgement",
    //   key: "acknowledgement",
    //   href: "/admin-acknowledgement"
    // },

    // {
    //   name: "Team Management",
    //   key: "teamManagement",
    //   href: "/admin-team-management"
    // },

    // {
    //   name: "TICKETS",
    //   key: "createTickets",
    //   href: "/admin-createTicket"
    // },
    // {
    //   name: "Reset Password",
    //   key: "resetPassword",
    //   href: "/admin-update-password"
    // }
  ];





  const clientManagerTabs = [
    {
      name: "CLIENT MANAGER",
      key: "clientManager",
      href: "/user-ClientManager"
    }
  ];
  const clientMasterTabs = [
    {
      name: "CANDIDATE MANAGER",
      key: "candidateManager",
      href: "/user-candidateManager"
    }
  ];
  const createInvoiceTabs = [
    {
      name: "CREATE USERS",
      key: "createUsers",
      href: "/user-create"
    },
    {
      name: "USER LISTING",
      key: "userListing",
      href: "/user-listing"
    }
  ];
  const reportMasterTabs = [
    {
      name: "VERIFICATION STATUS",
      key: "verificationStatus",
      href: "/user-verificationStatus"
    }
  ];
  const bulkApplicationTabs = [
    {
      name: "BULK APPLICATION",
      key: "bulkApplication",
      href: "/user-bulkApplication",
      button: true // Indicating that this tab is rendered as a button
    }
  ];
  const masterDashboard = [
    {
      name: "MASTER DASHBOARD",
      key: "masterDashboard",
      href: "/user-MasterDashboard"
    },
  ];
  const createTickets = [
    {
      name: "CREATE TICKETS",
      key: "createTickets",
      href: "/user-createTickets"
    },
  ];
  const checklistAndEscalation = [
    {
      name: "CHECKLIST AND ESCALATION MATRIX",
      key: "checklistAndEscalation",
      href: "/user-checklistAndEscalation"
    },
  ];
  const apiIntegration = [
    {
      name: "API INTEGRATION",
      key: "apiIntegration",
      href: "/user-ApiIntegration"
    },

  ];

  const seeMoreTabs = [
    // {
    //   name: "CHECKLIST AND ESCALATION MATRIX",
    //   key: "checklistAndEscalation",
    //   href: "/user-checklistAndEscalation"
    // },

    {
      name: "CREATE TICKETS",
      key: "createTickets",
      href: "/user-createTickets"
    },
    // {
    //   name: "API INTEGRATION",
    //   key: "apiIntegration",
    //   href: "/user-ApiIntegration"
    // },
    // {
    //   name: "User History",
    //   key: "userHistory",
    //   href: "user-dashboard" // Placeholder link
    // },
    // {
    //   name: "RESET PASSWORD",
    //   key: "RESET PASSWORD",
    //   href: "/user-update-password"
    // },
    //  {
    //   name: "VERIFICATION STATUS",
    //   key: "verificationStatus",
    //   href: "/user-verificationStatus"
    // }
  ];

  const handleSectionClick = (section) => {
    let tabs;
  
    if (activeTab === section) {
      setActiveTab(null);
      localStorage.removeItem('sectionTabs'); // Remove sectionTabs from localStorage if tab is closed
      setSectionTabs([]); // Clear sectionTabs
    } else {
      // Assign the appropriate tabs based on the section clicked
      if (section === "Employee Credentials") {
        tabs = employeeTabs;
      } else if (section === "Client Overview") {
        tabs = clientTabs;
      } else if (section === "Billing Dashboard") {
        tabs = invoiceTabs;
      } else if (section === "Report Master") {
        tabs = adminTabs;
      } else if (section === "Service Report Forms") {
        tabs = ServiceReportFormsTab;
      } else if (section === "Case Allocation") {
        tabs = CaseAllocationTab;
      } else if (section === "Human Resource Menu") {
        tabs = HumanResourceMenu;
      }else if (section === "Client Credentials") {
        tabs = clientCredential;
      } else if (section === "Admin Manager") {
        tabs = adminManager;
      } else if (section === "Data Management") {
        tabs = dataManagement;
      } else if (section === "See More") {
        tabs = seeMore;
      } else if (section === "CLIENT MANAGER") {
        tabs = clientManagerTabs;
      } else if (section === "CANDIDATE MANAGER") {
        tabs = clientMasterTabs;
      } else if (section === "CREATE USERS") {
        tabs = createInvoiceTabs;
      } else if (section === "VERIFICATION STATUS") {
        tabs = reportMasterTabs;
      } else if (section === "BULK APPLICATION") {
        tabs = bulkApplicationTabs;
      } else if (section === "SEE MORE") {
        tabs = seeMoreTabs;
      } else if (section === "TAT Reminder") {
        tabs = tatReminder;
      } else if (section === "User History") {
        tabs = userHistory;
      } else if (section === "Acknowledgement") {
        tabs = acknowledgement;
      }  else if (section === "Candidate Manager") {
        tabs = adminCandidateManager;
      }else if (section === "TICKETS") {
        tabs = createadminticket;
      } else if (section === "Team Management") {
        tabs = teamManagement;
      } else if (section === "MASTER DASHBOARD") {
        tabs = masterDashboard;
      } else if (section === "CREATE TICKETS") {
        tabs = createTickets;
      } else if (section === "CHECKLIST AND ESCALATION MATRIX") {
        tabs = checklistAndEscalation;
      } else if (section === "API INTEGRATION") {
        tabs = apiIntegration;
      }else if (section === "APPLICATION DOCUMENT") {
        tabs = documenttabs;
      } else if (section === "Personal Management") {
        tabs = leaveManagement;
      }
      else if (section === "Home") {
        tabs = [];
      }
  
      setSectionTabs(tabs);
      localStorage.setItem('sectiontabJson', JSON.stringify(tabs)); // Update localStorage after the state is updated
    }
  
    setActiveTab(section);
    
  };
  console.log('setActiveTab',activeTab)
  
 



  return (
    <SidebarContext.Provider value={{ handleSectionClick, activeTab, sectionTabs, setSectionTabs, openDropdown, setOpenDropdown }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};

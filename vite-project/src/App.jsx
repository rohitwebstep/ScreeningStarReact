import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { SidebarProvider } from './Components/SidebarContext'; // Corrected named import
import Submenu from './Components/Submenu';
import "./App.css"
import BackgroundVerificationForm from "./Components/background-form"
import DigitalAddressVerification from "./Components/DigitalAddressVerification"
import { ApiLoadingProvider } from "./Components/ApiLoadingContext";
import { BranchApiLoadingProvider } from "./Components/BranchApiLoadingContext";
import AdminBar from "./Components/adminBar";
import UserBar from "./Components/userBar";
import AdminHeader from "./Components/adminHeader"
import AdminLogin from "./Components/admin-Login";
import UserLogin from "./Components/userLogin";
import Dashboard from "./Components/Pages/dashboard";
import AddClient from "./Components/Pages/addClient";
import ScreeningstarAdmin from "./Components/Pages/screeningstarAdmin";
import CreateInvoice from "./Components/Pages/createInvoice";
import AdminManager from "./Components/Pages/adminManager";
import ReportMaster from "./Components/Pages/reportMaster";
import ClientCredentials from "./Components/Pages/clientCredentials";
import TATReminder from "./Components/Pages/tatReminder";
import Acknowledgement from "./Components/Pages/acknowledgement";
import CreateUser from "./Components/Pages/createUser";
import ClientSpoc from "./Components/Pages/clientSpoc";
import ActiveAccounts from "./Components/Pages/activeAccounts";
import InactiveClients from "./Components/Pages/inactiveClients";
import GenerateInvoice from "./Components/Pages/generateInvoice";
import RecordTrackers from "./Components/Pages/recordsTrackers";
import InvoiceMaster from "./Components/Pages/invoiceMaster";
import EscalationManager from "./Components/Pages/escalationManager";
import BillingSpoc from "./Components/Pages/billingSpoc";
import LeaveManagement from "./Components/Pages/LeaveManagement";
import HumanResourceMenu from "./Components/Pages/HumanResourceMenu";
import BillingEscalation from "./Components/Pages/billingEscalation";
import AuthorizedDetails from "./Components/Pages/authorizedDetails";
import ExistingUsers from "./Components/Pages/existingUsers";
import ApplicationStatus from "./Components/Pages/applicationStatus";
import AdminChekin from "./Components/Pages/adminChekin";
import GenerateReport from "./Components/Pages/generateReport";
import GenerateReportServiceForm from "./Components/Pages/GenerateReportServiceForms";
import DataGenerateReport from "./Components/Pages/DataGenerateReport";
import Form1 from "./Components/Pages/CandidateApplication/form1";
import Form2 from "./Components/Pages/CandidateApplication/form2";
import Form3 from "./Components/Pages/CandidateApplication/form3";
import EditUser from "./Components/Pages/editUser";
import PrepareReport from "./Components/Pages/prepareReport";
import ServiceManagement from "./Components/Pages/serviceManagment";
import ServiceManagementGroup from "./Components/Pages/ServiceManagmentGroup";
import PackageManagement from "./Components/Pages/packageManagment";
import LoginCheck from './Components/Pages/LoginCheck';
import IsNotLogin from './Components/Pages/isNotLogin';
import DataManagement from "./Components/Pages/dataManagment";
import TeamManagment from "./Components/Pages/teamManagment";
import ClientManagementData from "./Components/Pages/admin-clienttable";
import UserHistory from "./Components/Pages/UserHistory";
import ViewUser from "./Components/Pages/ViewUser";
import CreateAdminTicket from "./Components/Pages/CreateAdminTicket";
import ViewAdminTicket from "./Components/Pages/ViewAdminTicket";
import RecordTracker from "./Components/Pages/Record&Tracker";
import TeamManagementGenerateReport from "./Components/Pages/TeamManagementReportGenerate";
import TeamManagementCheckin from "./Components/Pages/TeamManagementCheckin";
import AdminCandidateManager from "./Components/Pages/AdminCandidateManager";
import AdminCandidateCheckin from "./Components/Pages/AdminCandidateCheckin";
import ServiceReportForm from "./Components/Pages/ServiceReportForm";







import 'react-select-search/style.css'
import SelectSearch from 'react-select-search';
import AdminForgotPassword from './Components/Pages/Admin-Forgot-Password';
import AdminSetPassword from './Components/Pages/Admin-Set-Password';
import AdminUpdatePassword from "./Components/Pages/Admin-Update-Password"
import PermissionManager from './Components/Pages/PermissionManager';
import  DataCheckin from './Components/Pages/DataCheckin';
import  Documents from './Components/Pages/Documents';
import  DocumentCheckin from './Components/Pages/DocumentCheckin';
import  CandidateBGV from './Components/Pages/AdminCandidateBGV';
import  CandidateDAV from './Components/Pages/AdminCandidateDAV';


import CaseAllocationList from "./Components/Pages/CaseAllocationList";
import CaseAllocation from "./Components/Pages/CaseAllocation";



import BranchLoginCheck from './Components/UserPages/Branch-LoginCheck';
import UserDashboard from "./Components/UserPages/userDashboard"
import UserCreate from "./Components/UserPages/createUser";
import VerificationStatus from "./Components/UserPages/VerificationStatus";
import BulkApplication from "./Components/UserPages/BulkApplication";
import ChecklistAndEscalation from "./Components/UserPages/ChecklistAndEscalation";
import MasterDashboard from "./Components/UserPages/MasterDashboard";
import CreateTickets from "./Components/UserPages/CreateTickets";
import ApiIntegration from "./Components/UserPages/ApiIntegration";
import CandidateManager from "./Components/UserPages/CandidateManager";
import ClientManager from "./Components/UserPages/ClientManager";
import DataTable from "./Components/UserPages/innerpages/MasterTable";
import UserHeader from "./Components/UserPages/userHeader";
import UserForgotPassword from './Components/UserPages/User-Forgot-Password';
import UserSetPassword from "./Components/UserPages/User-reset-password";
import UserUpdatePassword from "./Components/UserPages/User-Update-Password";
import ClientBulkUpload from "./Components/UserPages/ClientBulkUpload"
import CandidateBulkUpload from "./Components/UserPages/CandidateBulkUpload"
import UserListing from "./Components/UserPages/User-Listing"
import ViewUserTicket from "./Components/UserPages/viewUserTicket"



import { MobileProvider } from "./Components/MobileContext";
import { ClientProvider } from "./Components/Pages/ClientContext";
import EditClient from "./Components/Pages/EditClient";
import { ServiceProvider } from "./Components/Pages/ServiceContext";
import Modules from "./Components/Pages/Modules";
import ViewModules from "./Components/Pages/ModuleView";
import ServiceBGVForm from "./Components/Pages/ServiceBGVForm";
import GenerateServiceBGVForm from "./Components/Pages/GenerateServiceBGVForm";
import LeaveListing from "./Components/Pages/LeaveListing";
import MyProfile from "./Components/UserPages/MyProfile";
import Attendance from "./Components/Pages/Attendance";
import ApplicationTrash from "./Components/Pages/ApplicationTrash";
import ApplicationTrashCheckin from "./Components/Pages/ApplicationTrashCheckin";
import CustomerTrash from "./Components/Pages/CustomerTrash";
import CLientTrashed from "./Components/UserPages/CLientTrashed";
import Universities from "./Components/Pages/Universities";
import ExEmployements from "./Components/Pages/ExEmployments";
import Vendors from "./Components/Pages/Vendors";
import BusinessDevelopmentActivity from "./Components/Pages/BusinessDevelopmentActivity";
import UniversitiesBulk from "./Components/Pages/UniversitiesBulk";
import ExEmploymentBulk from "./Components/Pages/ExEmploymentBulk";
import VendorBulk from "./Components/Pages/VendorBulk";
import BusinessDevelopmentBulk from "./Components/Pages/BusinessDevelopmentBulk";
import CaseAllocationBulk from "./Components/Pages/CaseAllocationBulk";
import TimeManagement from "./Components/Pages/TimeManagement";

const Layout = () => {
  const location = useLocation();
  const isUserRoute = location.pathname.startsWith("/user");
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname === "/";
  const hideSidebarAndHeader =
    location.pathname === "/admin-login" ||
    location.pathname === "/admin-forgot-password" ||
    location.pathname === "/user-forgot-password" ||
    location.pathname === "/admin-set-password" ||
    location.pathname === "/branch/reset-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/userLogin"||
    location.pathname === "/admin-update-password"||
    location.pathname === "/user-update-password" ||
    location.pathname === "/background-form" ||
    location.pathname === "/digital-form"
    
  return (
    <div className="">
      <div className="flex flex-col h-screen ">
        {!hideSidebarAndHeader && (
          <>
            {isUserRoute && !isAdminRoute && <UserHeader />}
            {isAdminRoute && !isUserRoute && <AdminHeader />}
            
          </>
        )}
        <div className="block md:flex flex-grow desktopPOS">
          {!hideSidebarAndHeader && (
            <>
              {isUserRoute && <UserBar />}
              {isAdminRoute && !isUserRoute && <AdminBar />}
            </>
          )}
          <div className="flex-grow w-full overflow-hidden h-full ">
            {!hideSidebarAndHeader && <Submenu />}
            <Routes>

            <Route path="/background-form" element={<BackgroundVerificationForm />} />
            <Route path="/digital-form" element={<DigitalAddressVerification />} />
         
              <Route path="/userLogin" element={<UserLogin />} />
              <Route path="/" element={ <LoginCheck><Dashboard /></LoginCheck>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-forgot-password" element={<IsNotLogin><AdminForgotPassword /></IsNotLogin>} />
              <Route path="/reset-password" element={<IsNotLogin><AdminSetPassword /></IsNotLogin>} />
              <Route path="/admin-update-password" element={<AdminUpdatePassword />} />
              <Route path="/admin-add-new-client" element={<AddClient />} />
              <Route path="/admin-editclient" element={<EditClient />} />
              <Route path="/admin-screeningstar-admin" element={<ScreeningstarAdmin />} />
              <Route path="/admin-create-invoice" element={<CreateInvoice />} />
              <Route path="/admin-admin-manager" element={<AdminManager />} />
              <Route path="/admin-candidate-manager" element={<AdminCandidateManager />} />
              <Route path="/admin-CandidateBGV" element={<CandidateBGV />} />
              <Route path="/admin-CandidateDAV" element={<CandidateDAV />} />
              <Route path="/admin-Modules" element={<Modules/>} />
              <Route path="/admin-ViewModules" element={<ViewModules/>} />
               <Route path="/admin-UniversitiesBulk" element={<UniversitiesBulk/>} />
              <Route path="/admin-ExEmploymentBulk" element={<ExEmploymentBulk/>} />
              <Route path="/admin-VendorBulk" element={<VendorBulk/>} />
              <Route path="/admin-BusinessDevelopmentBulk" element={<BusinessDevelopmentBulk/>} />
              <Route path="/admin-CaseAllocationBulk" element={<CaseAllocationBulk/>} />

              
              <Route path="/admin-DocumentCheckin" element={<DocumentCheckin />} />

              <Route path="/admin-documents" element={<Documents />} />

              <Route path="/admin-data-management" element={<DataManagement />} />
              <Route path="/admin-report-master" element={<ReportMaster />} />
              <Route path="/admin-client-credentials" element={<ClientCredentials />} />
              <Route path="/admin-tat-reminder" element={<TATReminder />} />
              <Route path="/admin-acknowledgement" element={<Acknowledgement />} />
              <Route path="/admin-createUser" element={<CreateUser />} />
              <Route path="/admin-client-spoc" element={<ClientSpoc />} />
              <Route path="/admin-escalation-manager" element={<EscalationManager />} />
              <Route path="/admin-billing-spoc" element={<BillingSpoc />} />
              <Route path="/admin-billing-esclation" element={<BillingEscalation />} />
              <Route path="/admin-authorized-details" element={<AuthorizedDetails />} />
              <Route path="/admin-active-account" element={<ActiveAccounts />} />
              <Route path="/admin-inactive-clients" element={<InactiveClients />} />
              <Route path="/admin-generate-invoice" element={<GenerateInvoice />} />
              <Route path="/admin-records-and-trackers" element={<RecordTrackers />} />
              <Route path="/admin-invoice-master" element={<InvoiceMaster />} />
              <Route path="/admin-existing-users" element={<ExistingUsers />} />
              <Route path="/admin-application-status" element={<ApplicationStatus />} />
              <Route path="/admin-chekin" element={<AdminChekin />} />
              <Route path="/admin-CandidateCheckin" element={<AdminCandidateCheckin />} />
              <Route path="/admin-DataCheckin" element={<DataCheckin />} />
              <Route path="/admin-user-history" element={<UserHistory />} />
              <Route path="/admin-ViewUser" element={<ViewUser />} />
              <Route path="/admin-createTicket" element={<CreateAdminTicket />} />
              <Route path="/admin-ViewAdminTicket" element={<ViewAdminTicket />} />
              <Route path="/admin-RecordTracker" element={<RecordTracker />} />
              <Route path="/admin-TeamManagementGenerateReport" element={<TeamManagementGenerateReport />} />
              <Route path="/admin-TeamManagementCheckin" element={<TeamManagementCheckin />} />
              <Route path="/admin-ServiceReportForm" element={<ServiceReportForm />} />
              <Route path="/admin-CaseAllocationList" element={<CaseAllocationList/>} />
              <Route path="/admin-CaseAllocation" element={<CaseAllocation/>} />
              <Route path="/admin-LeaveManagement" element={<LeaveManagement/>} />
              <Route path="/admin-HumanResourceMenu" element={<HumanResourceMenu/>} />
              <Route path="/admin-ServiceBGVForm" element={<ServiceBGVForm/>} />

              <Route path="/admin-GenerateServiceBGVForm" element={<GenerateServiceBGVForm/>} />
              <Route path="/admin-TimeManagement" element={<TimeManagement/>} />

 
              
              
              <Route path="/admin-GenerateReportServiceForm" element={<GenerateReportServiceForm />} />
              <Route path="/admin-generate-report" element={<GenerateReport />} />
              
              <Route path="/admin-DataGenerateReport" element={<DataGenerateReport />} />

              <Route path="/form1" element={<Form1 />} />
              <Route path="/form2" element={<Form2 />} />
              <Route path="/form3" element={<Form3 />} />
              <Route path="/admin-editUser/:userId" element={<EditUser />} />
              <Route path="/admin-prepare-report" element={<PrepareReport />} />
              <Route path="/admin-service-management" element={<ServiceManagement />} />
              <Route path="/admin-service-management-group" element={<ServiceManagementGroup />} />
              <Route path="/admin-package-management" element={<PackageManagement />} />
              <Route path="/admin-team-management" element={<TeamManagment />} />
              <Route path="/admin-clienttable" element={<ClientManagementData />} />
              <Route path="/admin-PermissionManager" element={<PermissionManager />} />
              <Route path="/admin-LeaveListing" element={<LeaveListing />} />
              <Route path="/admin-Attendance" element={<Attendance />} />
              <Route path="/admin-TrashApplications" element={<ApplicationTrash />} />
              <Route path="/admin-ApplicationTrashCheckin" element={<ApplicationTrashCheckin />} />
              <Route path="/admin-CustomerTrash" element={<CustomerTrash />} />
              <Route path="/admin-Universities" element={<Universities />} />
              <Route path="/admin-ExEmployements" element={<ExEmployements />} />
              <Route path="/admin-Vendors" element={<Vendors />} />
              <Route path="/admin-BusinessDevelopmentActivity" element={<BusinessDevelopmentActivity />} />

              


              
              
              

              <Route path="/user-dashboard" element={<BranchLoginCheck><UserDashboard /></BranchLoginCheck>} />
              <Route path="/user-ClientBulkUpload" element={<ClientBulkUpload />} />
              <Route path="/user-CandidateBulkUpload" element={<CandidateBulkUpload />} />



              <Route path="/user-create" element={ <UserCreate />} />
              <Route path="/user-candidateManager" element={<CandidateManager />} />
              <Route path="/user-verificationStatus" element={<VerificationStatus />} />
              <Route path="/user-bulkApplication" element={<BulkApplication />} />
              <Route path="/user-checklistAndEscalation" element={<ChecklistAndEscalation />} />
              <Route path="/user-MasterDashboard" element={<MasterDashboard /> } />
              <Route path="/user-createTickets" element={<CreateTickets />} />
              <Route path="/user-ApiIntegration" element={<ApiIntegration />} />
              <Route path="/user-ClientManager" element={<ClientManager />} />
              <Route path="/user-DataTable" element={<DataTable />} />
              <Route path="/user-forgot-password" element={<UserForgotPassword />} />
              <Route path="/branch/reset-password" element={<UserSetPassword />} />
              <Route path="/user-update-password" element={<UserUpdatePassword />} />
              <Route path="/user-listing" element={<UserListing />} />
              <Route path="/user-viewTicket" element={<ViewUserTicket />} />
              <Route path="/user-MyProfile" element={<MyProfile />} />
              <Route path="/user-CLientTrashed" element={<CLientTrashed />} />

              


              


            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (

    <SidebarProvider>
      <ServiceProvider>
        <MobileProvider>
      <ClientProvider>
      <ApiLoadingProvider>
      <BranchApiLoadingProvider>
        
        <Router basename="/">
          <Layout />
        </Router>
        </BranchApiLoadingProvider>
        </ApiLoadingProvider>
      </ClientProvider>
      </MobileProvider>
      </ServiceProvider>
    </SidebarProvider>
  );
};

export default App;

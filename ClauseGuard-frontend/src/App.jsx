import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import PolicyBuilderPage from './pages/PolicyBuilderPage'
import PolicyGeneratorWizard from './pages/PolicyGeneratorWizard'
import DocumentEditor from './pages/DocumentEditor'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Protected Routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/policies" element={<PolicyBuilderPage />} />
          <Route path="/generator" element={<PolicyGeneratorWizard />} />
          <Route path="/documents/:id" element={<DocumentEditor />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

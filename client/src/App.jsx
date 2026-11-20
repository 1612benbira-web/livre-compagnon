import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Spinner } from './components/common/Feedback.jsx';
import { AdminRoute, ProtectedRoute } from './components/common/RouteGuards.jsx';
import Layout from './components/layout/Layout.jsx';
import BookPage from './pages/BookPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import QuestionByIdPage from './pages/QuestionByIdPage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import QuestionsPage from './pages/QuestionsPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import SpacePage from './pages/SpacePage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';

// Administration chargée à la demande : les lecteurs (souvent sur mobile) ne téléchargent pas ce code
const AdminLayout = lazy(() => import('./components/layout/AdminLayout.jsx'));
const AdminAnswers = lazy(() => import('./pages/admin/AdminAnswers.jsx'));
const AdminBookForm = lazy(() => import('./pages/admin/AdminBookForm.jsx'));
const AdminBookQr = lazy(() => import('./pages/admin/AdminBookQr.jsx'));
const AdminBooks = lazy(() => import('./pages/admin/AdminBooks.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminQuestionForm = lazy(() => import('./pages/admin/AdminQuestionForm.jsx'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/admin/connexion" element={<AdminLoginPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="livres" element={<AdminBooks />} />
            <Route path="livres/nouveau" element={<AdminBookForm />} />
            <Route path="livres/:id/modifier" element={<AdminBookForm />} />
            <Route path="livres/:id/qr" element={<AdminBookQr />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="questions/nouvelle" element={<AdminQuestionForm />} />
            <Route path="questions/:id/modifier" element={<AdminQuestionForm />} />
            <Route path="utilisateurs" element={<AdminUsers />} />
            <Route path="reponses" element={<AdminAnswers />} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="livre/:id" element={<BookPage />} />
          <Route path="question-du-jour" element={<QuestionPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="questions/:id" element={<QuestionByIdPage />} />
          <Route path="connexion" element={<LoginPage />} />
          <Route path="inscription" element={<RegisterPage />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="resultat/:answerId" element={<ResultPage />} />
            <Route path="espace" element={<SpacePage />} />
            <Route path="progression" element={<ProgressPage />} />
            <Route path="historique" element={<HistoryPage />} />
            <Route path="profil" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { Login } from '../pages/Login'
import { MeetingAccess } from '../pages/MeetingAccess'
import { ForgotPassword } from '../pages/ForgotPassword'
import { ResetPassword } from '../pages/ResetPassword'
import { Condominios } from '../pages/Condominios'
import { Reunioes } from '../pages/Reunioes'
import { Agendar } from '../pages/Agendar'
import { Detalhes } from '../pages/Detalhes'
import { Pautas } from '../pages/Pautas'
import { Convites } from '../pages/Convites'
import { Procurador } from '../pages/Procurador'
import { Usuarios } from '../pages/Usuarios'
import { UsuarioForm } from '../pages/UsuarioForm'
import { Votacoes } from '../pages/Votacoes'
import { VotacaoForm } from '../pages/VotacaoForm'
import { Voto } from '../pages/Voto'
import { Resultado } from '../pages/Resultado'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/acesso" element={<MeetingAccess />} />
      <Route path="/acesso/:token" element={<MeetingAccess />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha/:token" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/condominios" replace />} />
        <Route path="/condominios" element={<Condominios />} />
        <Route path="/condominios/:condominiumId/reunioes" element={<Reunioes />} />
        <Route
          path="/condominios/:condominiumId/reunioes/nova"
          element={
            <ProtectedRoute roles={['administrator']}>
              <Agendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/condominios/:condominiumId/usuarios"
          element={
            <ProtectedRoute roles={['administrator']}>
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/condominios/:condominiumId/usuarios/novo"
          element={
            <ProtectedRoute roles={['administrator']}>
              <UsuarioForm />
            </ProtectedRoute>
          }
        />
        <Route path="/usuarios/:id" element={<UsuarioForm />} />

        <Route path="/reunioes/:id" element={<Detalhes />} />
        <Route
          path="/reunioes/:meetingId/pautas"
          element={
            <ProtectedRoute roles={['administrator']}>
              <Pautas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reunioes/:id/convites"
          element={
            <ProtectedRoute roles={['administrator']}>
              <Convites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reunioes/:id/procurador"
          element={
            <ProtectedRoute roles={['administrator']}>
              <Procurador />
            </ProtectedRoute>
          }
        />
        <Route path="/reunioes/:meetingId/votacoes" element={<Votacoes />} />
        <Route
          path="/reunioes/:meetingId/votacoes/nova"
          element={
            <ProtectedRoute roles={['administrator']}>
              <VotacaoForm />
            </ProtectedRoute>
          }
        />

        <Route path="/votacoes/:id" element={<VotacaoForm />} />
        <Route path="/votacoes/:id/votar" element={<Voto />} />
        <Route path="/votacoes/:id/resultado" element={<Resultado />} />
      </Route>

      <Route path="*" element={<Navigate to="/condominios" replace />} />
    </Routes>
  )
}

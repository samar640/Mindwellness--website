import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import AccountDashboard from "@/pages/Dashboard";
import WellnessPage from "@/pages/WellnessPage";
import BreathePage from "@/pages/BreathePage";
import DietPage from "@/pages/DietPage";
import TodoPage from "@/pages/TodoPage";
import HealingPage from "@/pages/HealingPage";
import JourneyPage from "@/pages/JourneyPage";
import DashboardPage from "@/pages/DashboardPage";
import BooksPage from "@/pages/BooksPage";
import NotFound from "@/pages/not-found";
import { Protected } from "@/components/auth/Protected";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">{() => <Protected><DashboardPage /></Protected>}</Route>
      <Route path="/journey">{() => <Protected><JourneyPage /></Protected>}</Route>
      <Route path="/wellness">{() => <Protected><WellnessPage /></Protected>}</Route>
      <Route path="/healing">{() => <Protected><HealingPage /></Protected>}</Route>
      <Route path="/breathe">{() => <Protected><BreathePage /></Protected>}</Route>
      <Route path="/diet">{() => <Protected><DietPage /></Protected>}</Route>
      <Route path="/todo">{() => <Protected><TodoPage /></Protected>}</Route>
      <Route path="/books">{() => <Protected><BooksPage /></Protected>}</Route>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/account">{() => <Protected><AccountDashboard /></Protected>}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

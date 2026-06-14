import { Route, Routes } from "react-router";
import { Home } from "./components/Home";
import { LoginForm } from "./components/LoginForm";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StudentForm } from "./components/StudentForm";
import { StudentList } from "./components/StudentList";

export default function App() {

  return (
    <main className="min-h-svh dark bg-background text-foreground">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<StudentForm />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/lists" element={<StudentList />} />
        </Route>
      </Routes>
    </main>
  );
};

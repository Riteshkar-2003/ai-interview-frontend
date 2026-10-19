"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, googleLogin } from "../../lib/api";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import {
  Mail,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";


export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);

      if (result?.success && result?.user) {

        localStorage.setItem("user", JSON.stringify(result.user));

        router.push("/profile");
      } else {
        setError(result?.message || "Invalid email or password.");
      }
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google) {
        console.error(
          "Google Identity Services not loaded"
        );
        return;
      }

      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error(
          "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing"
        );

        setError(
          "Google Client ID is missing."
        );

        return;
      }

      console.log(
        "Google Client ID:",
        clientId
      );

      console.log(
        "Current origin:",
        window.location.origin
      );

      // ==========================================
      // GOOGLE ID TOKEN INITIALIZATION
      // ==========================================
      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          console.log(
            "========== GOOGLE CALLBACK =========="
          );

          console.log(
            "Google response:",
            response
          );

          console.log(
            "Credential exists:",
            !!response?.credential
          );

          // IMPORTANT
          // Google MUST return an ID token
          if (!response?.credential) {
            console.error(
              "Google did not return credential"
            );

            setError(
              "Google did not return a login credential. Please try again."
            );

            return;
          }

          try {
            setGoogleLoading(true);
            setError("");

            console.log(
              "Sending credential to backend..."
            );

            // IMPORTANT:
            // Pass ONLY response.credential
            const result = await googleLogin(
              response.credential
            );

            console.log(
              "Backend Google login result:",
              result
            );

            if (!result?.user) {
              throw new Error(
                "Backend did not return user information."
              );
            }

            // Save user
            localStorage.setItem(
              "user",
              JSON.stringify(result.user)
            );

            console.log(
              "Google login successful"
            );

            router.push("/profile");

          } catch (error) {
            console.error(
              "Google backend login error:",
              error
            );

            setError(
              error?.message ||
              "Google login failed."
            );

          } finally {
            setGoogleLoading(false);
          }
        },

        auto_select: false,
        cancel_on_tap_outside: true,
      });

      console.log(
        "Google Identity Services initialized"
      );
    };

    // ==========================================
    // LOAD GOOGLE SCRIPT
    // ==========================================
    if (window.google) {
      initializeGoogle();
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log(
        "Google script loaded"
      );

      initializeGoogle();
    };

    script.onerror = () => {
      console.error(
        "Failed to load Google script"
      );

      setError(
        "Unable to load Google Login."
      );
    };

    document.head.appendChild(script);

    return () => {
      if (
        script.parentNode
      ) {
        script.parentNode.removeChild(
          script
        );
      }
    };
  }, [router]);

  // ==========================================
  // GOOGLE LOGIN BUTTON
  // ==========================================
  const handleGoogleLogin = () => {
    setError("");

    if (!window.google) {
      setError(
        "Google Login is not loaded yet."
      );
      return;
    }

    setGoogleLoading(true);

    /*
     * Use Google's ID-token button flow.
     *
     * We do NOT use googleButtonRef.
     *
     * The Google button is rendered into the
     * element with id="google-login-button".
     */

    const container =
      document.getElementById(
        "google-login-button"
      );

    if (!container) {
      console.error(
        "Google button container not found"
      );

      setGoogleLoading(false);

      return;
    }

    // Clear previous Google button
    container.innerHTML = "";

    window.google.accounts.id.renderButton(
      container,
      {
        theme: "outline",
        size: "large",
        width: 350,
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
      }
    );

    /*
     * Automatically click Google's generated
     * button after rendering.
     */
    setTimeout(() => {
      const googleButton =
        container.querySelector(
          'div[role="button"]'
        );

      if (googleButton) {
        googleButton.click();
      }

      setGoogleLoading(false);
    }, 100);
  };








  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f7ff] flex items-center justify-center px-6">


      <motion.div
        className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      <motion.div
        className="pointer-events-none fixed -right-32 top-40 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl"
        animate={{
          x: [0, -70, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      <motion.div
        className="pointer-events-none fixed bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-300/20 blur-3xl"
        animate={{
          y: [0, -70, 0],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/20  p-8 shadow-2xl backdrop-blur-xl">


          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome Back
            </h1>

            <p className="mt-2 text-slate-500">
              Login to continue your interview
            </p>
          </motion.div>


          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}


          {/* <form
            onSubmit={handleLogin}
            className="mt-6 space-y-5"
          >


            <div className="relative ">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-900"
              >
                Email
              </label>

              <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

              

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="mt-2 w-full rounded-lg border bg-white border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>


            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-900"
              >
                Password
              </label>

              <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                required
              />


              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
            </div>


            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>
          </form> */}




          <form onSubmit={handleLogin} className="mt-6 space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-900"
              >
                Email
              </label>

              <div className="relative mt-2">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-800 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>
            </div>


            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-900"
              >
                Password
              </label>

              <div className="relative mt-2">
                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-800 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>


            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>

          </form>



          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-300" />

            <span className="text-sm text-gray-500">
              OR
            </span>

            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            whileHover={
              !loading
                ? { scale: 1.02 }
                : {}
            }
            whileTap={
              !loading
                ? { scale: 0.98 }
                : {}
            }
            className="relative flex w-full items-center justify-center gap-5 rounded-lg bg-white py-3 font-semibold text-slate-700 shadow-lg shadow-violet-500/20 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <FcGoogle
              size={22}
            />
            <span>
              continue with google
            </span>
          </motion.button>

          {/* Hidden Google button container */}
          <div
            id="google-login-button"
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              width: "350px",
            }}
          />



          <p className="mt-6 text-center text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="font-medium text-violet-500 transition hover:text-violet-400 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}




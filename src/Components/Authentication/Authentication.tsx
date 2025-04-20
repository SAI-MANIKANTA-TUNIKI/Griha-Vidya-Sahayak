import React, { useState } from "react";
import styles from "../Pagesmodulecss/Authentication.module.css";
import { supabase } from "../../Supabaesdata/supabaseClient";
import { useNavigate } from "react-router-dom";

interface AuthenticationProps {
  onLogin: () => void;
}

const Authentication: React.FC<AuthenticationProps> = ({ onLogin }) => {
  const [isActive, setIsActive] = useState(false);
  const [signUpValues, setSignUpValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginValues, setLoginValues] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpValues({ ...signUpValues, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginValues({ ...loginValues, [e.target.name]: e.target.value });
  };

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: signUpValues.email,
      password: signUpValues.password,
      options: {
        data: {
          name: signUpValues.name,
        },
      },
    });

    if (error) {
      alert(`Sign Up Error: ${error.message}`);
    } else {
      alert("User registered successfully. Please check your email to confirm your account.");
      setIsActive(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginValues.email,
      password: loginValues.password,
    });

    if (error) {
      alert(`Login Error: ${error.message}`);
    } else if (data.session) {
      onLogin();
      navigate("/home");
    }
  };

  return (
    <div className={`${styles.wrapper} ${isActive ? styles.active : ""}`}>
      {/* Login Form */}
      <div className={`${styles["form-box"]} ${styles.login}`}>
        <h2 className={styles.title}>Login</h2>
        <form onSubmit={handleLoginSubmit}>
          <div className={styles["input-box"]}>
            <input
              type="email"
              name="email"
              required
              value={loginValues.email}
              onChange={handleLoginChange}
              aria-label="Email"
            />
            <label>Email</label>
            <i className="bx bxs-envelope"></i>
          </div>
          <div className={styles["input-box"]}>
            <input
              type="password"
              name="password"
              required
              value={loginValues.password}
              onChange={handleLoginChange}
              aria-label="Password"
            />
            <label>Password</label>
            <i className="bx bxs-lock-alt"></i>
          </div>
          <button type="submit" className={styles.btn} aria-label="Login">
            Login
          </button>
          <div className={styles.linkTxt}>
            <p>
              Don't have an account?{" "}
              <a
                href="#"
                className={styles["register-link"]}
                onClick={(e) => {
                  e.preventDefault();
                  setIsActive(true);
                }}
              >
                Sign Up
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* Login Info Text */}
      <div className={`${styles["info-text"]} ${styles.login}`}>
        <h2>Welcome Back!</h2>
        <p>Log in to access your account and continue your journey.</p>
      </div>

      {/* Sign-Up Form */}
      <div className={`${styles["form-box"]} ${styles.register}`}>
        <h2 className={styles.title}>Sign Up</h2>
        <form onSubmit={handleSignUpSubmit}>
          <div className={styles["input-box"]}>
            <input
              type="text"
              name="name"
              required
              value={signUpValues.name}
              onChange={handleSignUpChange}
              aria-label="Username"
            />
            <label>Username</label>
            <i className="bx bxs-user"></i>
          </div>
          <div className={styles["input-box"]}>
            <input
              type="email"
              name="email"
              required
              value={signUpValues.email}
              onChange={handleSignUpChange}
              aria-label="Email"
            />
            <label>Email</label>
            <i className="bx bxs-envelope"></i>
          </div>
          <div className={styles["input-box"]}>
            <input
              type="password"
              name="password"
              required
              value={signUpValues.password}
              onChange={handleSignUpChange}
              aria-label="Password"
            />
            <label>Password</label>
            <i className="bx bxs-lock-alt"></i>
          </div>
          <button type="submit" className={styles.btn} aria-label="Sign Up">
            Sign Up
          </button>
          <div className={styles.linkTxt}>
            <p>
              Already have an account?{" "}
              <a
                href="#"
                className={styles["login-link"]}
                onClick={(e) => {
                  e.preventDefault();
                  setIsActive(false);
                }}
              >
                Login
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* Sign-Up Info Text */}
      <div className={`${styles["info-text"]} ${styles.register}`}>
        <h2>Create Account</h2>
        <p>Join us today by signing up for a new account.</p>
      </div>
    </div>
  );
};

export default Authentication;
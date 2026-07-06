import { useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import AuthModal from "../components/AuthModal";
import { getRandomUserAvatar } from "../utils/env";

const avatars = [
  getRandomUserAvatar("men", 32),
  getRandomUserAvatar("women", 44),
  getRandomUserAvatar("men", 45),
  getRandomUserAvatar("women", 46),
];

const features = [
  {
    icon: "🔒",
    title: "Secure Submission",
    description:
      "Enterprise-grade security with end-to-end encryption for all your data submissions.",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    icon: "📊",
    title: "Stay Organized",
    description:
      "Keep all your submissions organized and easily accessible in one centralized platform.",
    gradient: "from-green-500 to-teal-500",
  },
  {
    icon: "🙏",
    title: "Support Ministry",
    description:
      "Contribute to the work of the ministry through streamlined data collection processes.",
    gradient: "from-orange-500 to-red-500",
  },
];

const testimonials = [
  {
    name: "Pastor John Smith",
    role: "Senior Minister",
    content:
      "This platform has revolutionized how we collect and manage ministry data. Highly recommended!",
    avatar: getRandomUserAvatar("men", 1),
  },
  {
    name: "Sarah Johnson",
    role: "Department Head",
    content:
      "The security features give us peace of mind, and the organization tools are incredible.",
    avatar: getRandomUserAvatar("women", 2),
  },
  {
    name: "Michael Brown",
    role: "Administrator",
    content:
      "Streamlined workflow that saves us hours every week. The best ministry platform we've used.",
    avatar: getRandomUserAvatar("men", 3),
  },
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [0, -50]);
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-200 to-orange-200 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Navigation Bar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg"
            : "bg-transparent"
        }`}
        style={{ y, opacity }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}>
              <img
                src="/logo.png"
                alt="The Sword of the Spirit Ministries Logo"
                className="h-12 w-auto drop-shadow-lg"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold gradient-text">
                  The Sword of the Spirit Ministries
                </p>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { id: "home", label: "Home" },
                { id: "features", label: "Features" },
                { id: "testimonials", label: "Testimonials" },
                { id: "contact", label: "Contact" },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? "text-purple-600"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}>
                  {item.label}
                </motion.button>
              ))}
            </div>

            {/* Login Button */}
            <motion.button
              onClick={() => {
                setAuthTab("login");
                setAuthOpen(true);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}>
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust indicators */}
          <motion.div
            className="flex items-center justify-center mb-8 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}>
            <div className="flex items-center -space-x-2">
              {avatars.map((src, i) => (
                <motion.img
                  key={src}
                  src={src}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full border-3 border-white shadow-lg ring-2 ring-purple-100"
                  style={{ zIndex: 10 - i }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5, type: "spring" }}
                />
              ))}
            </div>
            <div className="ml-4 text-left">
              <p className="text-sm text-gray-600 font-medium">
                Trusted by{" "}
                <span className="font-bold gradient-text">
                  Believers, Ministers, Departments
                </span>
              </p>
              <p className="text-xs text-gray-500">+20 others actively using</p>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div
            className="max-w-5xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}>
                Empowered by the Word.
              </motion.span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}>
                Led by the Spirit.
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-gray-600 text-xl sm:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}>
            Welcome to The Sword of the Spirit Ministries' submission portal —
            securely submit your data, stay organized, and support the work of
            the ministry.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}>
            <motion.button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="group relative px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}>
              <span className="flex items-center gap-3">
                Get Started
                <motion.svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </span>
            </motion.button>

            <motion.button
              onClick={() => scrollToSection("features")}
              className="px-10 py-4 border-2 border-purple-600 text-purple-600 rounded-2xl font-semibold text-lg hover:bg-purple-600 hover:text-white transition-all duration-300"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}>
              Learn More
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <motion.div
                className="w-1 h-3 bg-gray-400 rounded-full mt-2"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of security, organization, and
              ministry support
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-effect rounded-3xl p-8 text-center hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}>
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto text-3xl`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}>
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied ministry leaders and administrators
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="glass-effect rounded-3xl p-8"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}>
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join our community of ministry leaders and start organizing your
              data today
            </p>
            <motion.button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}>
              Start Your Journey
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 The Sword of the Spirit Ministries. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

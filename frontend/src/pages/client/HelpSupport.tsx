import React from 'react';
import { MessageCircle, Phone, Mail, ExternalLink, ChevronLeft, ChevronRight, BookOpen, Video, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: 'How do I book a session?',
        answer: 'Go to the Book tab, select your preferred coach (or "Any Coach"), choose a date and available time slot, then tap "Confirm Booking".'
    },
    {
        question: 'Can I cancel a session?',
        answer: 'Yes! You can cancel up to 24 hours before your session without losing credits. Late cancellations may use a session credit.'
    },
    {
        question: 'How does EMS training work?',
        answer: 'EMS (Electrical Muscle Stimulation) activates your muscles using electrical impulses, making your workout more effective in less time.'
    },
    {
        question: 'How often should I train?',
        answer: 'We recommend 1-2 sessions per week with at least 48 hours rest between sessions for optimal results.'
    },
];

const HelpSupport: React.FC = () => {
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-4 pb-24 max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6 animate-fade-in-up">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">We're here to help</p>
                    </div>
                </header>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up">
                    <button className="premium-card p-4 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Live Chat</span>
                        <span className="text-xs text-gray-500">Usually responds in 5 min</span>
                    </button>
                    <button className="premium-card p-4 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2">
                            <Phone size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Call Us</span>
                        <span className="text-xs text-gray-500">Mon-Sat, 9AM-6PM</span>
                    </button>
                </div>

                {/* FAQs */}
                <section className="mb-6 animate-fade-in-up stagger-1">
                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                        Frequently Asked Questions
                    </h2>
                    <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800">
                        {faqs.map((faq, index) => (
                            <div key={index} className="overflow-hidden">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full p-4 flex justify-between items-center text-left"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                                    <ChevronRight
                                        size={18}
                                        className={`text-gray-400 transition-transform flex-shrink-0 ${expandedFaq === index ? 'rotate-90' : ''}`}
                                    />
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 animate-fade-in-up">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Resources */}
                <section className="mb-6 animate-fade-in-up stagger-2">
                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                        Resources
                    </h2>
                    <div className="space-y-2">
                        <button className="premium-card p-4 w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-purple-500" />
                                <span className="font-medium text-gray-900 dark:text-white">EMS Training Guide</span>
                            </div>
                            <ExternalLink size={16} className="text-gray-400" />
                        </button>
                        <button className="premium-card p-4 w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Video size={18} className="text-red-500" />
                                <span className="font-medium text-gray-900 dark:text-white">Video Tutorials</span>
                            </div>
                            <ExternalLink size={16} className="text-gray-400" />
                        </button>
                        <button className="premium-card p-4 w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-blue-500" />
                                <span className="font-medium text-gray-900 dark:text-white">Terms & Privacy Policy</span>
                            </div>
                            <ExternalLink size={16} className="text-gray-400" />
                        </button>
                    </div>
                </section>

                {/* Contact Email */}
                <div className="premium-card p-5 text-center animate-fade-in-up stagger-3">
                    <Mail size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Still need help?</p>
                    <a href="mailto:support@emsstudio.com" className="text-blue-600 dark:text-blue-400 font-semibold">
                        support@emsstudio.com
                    </a>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;

import React from 'react';
import { X, Mail, MessageSquare, Gift, Bell } from 'lucide-react';

interface AutomationExamplesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (template: any) => void;
}

const EXAMPLES = [
    {
        title: 'Welcome Email',
        description: 'Send a warm welcome email immediately when a new lead is created.',
        triggerType: 'new_lead',
        actionType: 'send_email',
        icon: Mail,
        payload: {
            subject: 'Welcome to EMS Studio!',
            templateId: 'welcome_v1'
        },
        conditions: {}
    },
    {
        title: 'Re-engagement Campaign',
        description: 'Text clients who haven\'t booked a session in 30 days.',
        triggerType: 'inactive_client',
        actionType: 'send_sms',
        icon: MessageSquare,
        payload: {
            message: 'We miss you! Come back for a session and get 10% off.'
        },
        conditions: {
            daysSinceLastSession: 30
        }
    },
    {
        title: 'Birthday Discount',
        description: 'Send a birthday wish and discount code on their special day.',
        triggerType: 'birthday',
        actionType: 'send_email',
        icon: Gift,
        payload: {
            subject: 'Happy Birthday! Here is a gift for you',
            templateId: 'birthday_promo'
        },
        conditions: {}
    },
    {
        title: 'Lead Follow-up',
        description: 'Create a task for staff to call a lead if they haven\'t converted after 3 days.',
        triggerType: 'lead_status_changed',
        actionType: 'create_task',
        icon: Bell,
        payload: {
            taskTitle: 'Follow up with lead',
            priority: 'high'
        },
        conditions: {
            newStatus: 'new', // Logic would assume checking time passed, but this sets the base
            daysPending: 3 // Hypothetical condition handling
        }
    }
];

const AutomationExamplesModal: React.FC<AutomationExamplesModalProps> = ({ isOpen, onClose, onUseTemplate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-4xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Templates</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Select a template to get started quickly</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {EXAMPLES.map((example, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group bg-gray-50 dark:bg-slate-800/50"
                            onClick={() => onUseTemplate(example)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400">
                                    <example.icon size={24} />
                                </div>
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2 py-1 rounded capitalize">
                                    {example.triggerType.replace('_', ' ')}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {example.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                {example.description}
                            </p>

                            <div className="flex items-center text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                                <div className="flex flex-col">
                                    <span className="uppercase tracking-wide font-semibold mb-1">Action</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{example.actionType.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutomationExamplesModal;

import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShieldIcon, FileTextIcon, LockIcon } from '@/components/icons';

export function LegalPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 font-semibold">
                    <ArrowLeftIcon size={20} /> Back to Home
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-8">Legal & Security Center</h1>

                    <div className="space-y-12">
                        <section id="privacy">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                    <LockIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Privacy Policy</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                At SWIFTLINE, we take your privacy seriously. We only collect essential information needed to facilitate secure transactions.
                                Your personal data is encrypted and never shared with third parties for marketing purposes.
                            </p>
                        </section>

                        <section id="terms">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <FileTextIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Terms of Service</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                By using our platform, you agree to conduct honest transactions. SWIFTLINE acts as an escrow agent.
                                We reserve the right to suspend accounts suspected of fraud.
                            </p>
                        </section>

                        <section id="security">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                    <ShieldIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Security Policy</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                All funds are held in a regulated trust account. We use bank-grade AES-256 encryption.
                                Disputes are handled by our dedicated compliance team.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

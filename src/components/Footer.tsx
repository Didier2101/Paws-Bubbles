import { PawPrint, Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer id="contact" className="bg-gray-50 pt-20 pb-10 border-t border-gray-200">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-xl bg-indigo-600">
                                <PawPrint className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">Paws<span className="text-indigo-600">&</span>Bubbles</span>
                        </div>
                        <p className="text-gray-600 max-w-sm mb-8 leading-relaxed">
                            Dedicados al cuidado y bienestar de tus mascotas. Ofrecemos servicios de grooming profesional con los más altos estándares de calidad e higiene.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 transition-all group">
                                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 transition-all group">
                                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 transition-all group">
                                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-gray-900 font-bold mb-6">Contacto</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-indigo-600" />
                                +57 300 000 0000
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-indigo-600" />
                                hola@pawsandbubbles.com
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-indigo-600" />
                                Calle 123 #45-67, Bogotá
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-gray-900 font-bold mb-6">Horarios</h4>
                        <ul className="space-y-4">
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-600">Lunes - Viernes</span>
                                <span className="text-gray-900 font-medium">8:00 - 17:00</span>
                            </li>
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-600">Sábados</span>
                                <span className="text-gray-900 font-medium">8:00 - 14:00</span>
                            </li>
                            <li className="flex justify-between text-sm">
                                <span className="text-gray-600">Domingos</span>
                                <span className="text-indigo-600 font-bold italic">Cerrado</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} Paws & Bubbles Studio. Todos los derechos reservados.</p>
                    <a
                        href="/admin"
                        className="text-gray-500 hover:text-indigo-400 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        Entrar
                    </a>
                </div>
            </div>
        </footer>
    );
}

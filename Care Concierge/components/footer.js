// Footer Component
class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="bg-gray-800 text-white">
                <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div class="col-span-1 md:col-span-2">
                            <h3 class="text-2xl font-bold text-indigo-400 mb-4">CareConcierge</h3>
                            <p class="text-gray-300 mb-4 max-w-md">
                                Your dedicated Care Concierge handles the logistics, crises, and endless calls so you can stop being a manager and start being family again.
                            </p>
                            <div class="flex space-x-4">
                                <a href="#" class="text-gray-400 hover:text-indigo-400 transition duration-300">
                                    <i data-feather="facebook" class="w-5 h-5"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-indigo-400 transition duration-300">
                                    <i data-feather="twitter" class="w-5 h-5"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-indigo-400 transition duration-300">
                                    <i data-feather="linkedin" class="w-5 h-5"></i>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-indigo-400 transition duration-300">
                                    <i data-feather="instagram" class="w-5 h-5"></i>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Services</h4>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Care Coordination</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Safety Monitoring</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Medication Management</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Transportation</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Support</h4>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Help Center</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Contact Us</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Privacy Policy</a></li>
                                <li><a href="#" class="text-gray-300 hover:text-indigo-400 transition duration-300">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="border-t border-gray-700 mt-8 pt-8">
                        <div class="flex flex-col md:flex-row justify-between items-center">
                            <p class="text-gray-400 text-sm">
                                © 2024 CareConcierge. All rights reserved.
                            </p>
                            <div class="flex space-x-6 mt-4 md:mt-0">
                                <a href="#" class="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">Privacy</a>
                                <a href="#" class="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">Terms</a>
                                <a href="#" class="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">Cookies</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

customElements.define('custom-footer', CustomFooter);

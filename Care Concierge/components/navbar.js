// Navbar Component
class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="bg-white shadow-lg fixed w-full top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <h1 class="text-2xl font-bold text-indigo-600">CareConcierge</h1>
                            </div>
                        </div>
                        <div class="hidden md:flex items-center space-x-8">
                            <a href="#how-it-works" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-300">How It Works</a>
                            <a href="#pricing" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-300">Pricing</a>
                            <a href="#testimonials" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-300">Testimonials</a>
                            <a href="#contact" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300">Get Started</a>
                        </div>
                        <div class="md:hidden flex items-center">
                            <button id="mobile-menu-button" class="text-gray-700 hover:text-indigo-600 focus:outline-none focus:text-indigo-600">
                                <i data-feather="menu" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="mobile-menu" class="md:hidden hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                        <a href="#how-it-works" class="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">How It Works</a>
                        <a href="#pricing" class="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Pricing</a>
                        <a href="#testimonials" class="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Testimonials</a>
                        <a href="#contact" class="bg-indigo-600 hover:bg-indigo-700 text-white block px-3 py-2 rounded-md text-base font-medium">Get Started</a>
                    </div>
                </div>
            </nav>
        `;
        
        // Add mobile menu functionality
        const mobileMenuButton = this.querySelector('#mobile-menu-button');
        const mobileMenu = this.querySelector('#mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
}

customElements.define('custom-navbar', CustomNavbar);

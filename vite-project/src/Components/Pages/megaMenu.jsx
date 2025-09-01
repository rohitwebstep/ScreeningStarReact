import React from 'react';

const MegaMenu = () => {
  return (
    <div className="relative">
      <nav className="bg-gray-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="hidden md:flex space-x-4 w-full justify-center">
                <div className="relative group">
                  <button className="text-white px-4 py-2 rounded-md text-sm font-medium">
                    Services
                  </button>
                  {/* Full-width dropdown */}
                  <div className="absolute left-0 w-full mt-2 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Web Development</h4>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Frontend</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Backend</a>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Digital Marketing</h4>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">SEO Services</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Social Media</a>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">More Services</h4>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Content Writing</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Graphic Design</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button className="text-white px-4 py-2 rounded-md text-sm font-medium">
                    About
                  </button>
                  {/* Full-width dropdown */}
                  <div className="absolute left-0 w-full mt-2 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                    <div className="py-2">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Our Team</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Our Story</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Careers</a>
                    </div>
                  </div>
                </div>

                <a href="#" className="text-white px-4 py-2 rounded-md text-sm font-medium">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MegaMenu;

import React from 'react';
import { Shield, Mail, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-yellow-400" />
              <span className="font-semibold">AP Police</span>
            </div>
            <p className="text-gray-300 text-sm">
              Service Record Digitization Portal for efficient document processing and management.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Information</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>ap-police.gov.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>digitization@ap.police.gov.in</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Disclaimer</h4>
            <p className="text-gray-300 text-sm">
              This is a prototype application developed for the AP Police Hackathon 2025. 
              Not intended for real operational deployment without proper security auditing and approval.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Andhra Pradesh Police. Hackathon 2025 - Use Case 6. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
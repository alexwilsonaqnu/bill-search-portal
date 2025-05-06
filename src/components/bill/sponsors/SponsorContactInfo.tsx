
import { Mail, Phone } from "lucide-react";

interface SponsorContactInfoProps {
  emails?: string[];
  phones?: string[];
}

const SponsorContactInfo = ({ emails, phones }: SponsorContactInfoProps) => {
  // Debug output
  console.log("SponsorContactInfo received:", { emails, phones });
  
  // Return null if no contact info available
  if (!emails?.length && !phones?.length) {
    console.log("No contact info to display");
    return (
      <div className="text-sm text-gray-500 italic mt-2">
        No contact information available
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {emails && emails.length > 0 && (
        <div className="text-sm">
          <div className="font-medium flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Email:
          </div>
          <div className="space-y-1">
            {emails.map((email, i) => (
              <a 
                key={i} 
                href={`mailto:${email}`}
                className="text-blue-600 hover:underline block break-all"
              >
                {email}
              </a>
            ))}
          </div>
        </div>
      )}
      {phones && phones.length > 0 && (
        <div className="text-sm mt-2">
          <div className="font-medium flex items-center gap-1">
            <Phone className="h-4 w-4" />
            Phone:
          </div>
          <div className="space-y-1">
            {phones.map((phone, i) => (
              <a 
                key={i}
                href={`tel:${phone}`}
                className="text-blue-600 hover:underline block"
              >
                {phone}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorContactInfo;

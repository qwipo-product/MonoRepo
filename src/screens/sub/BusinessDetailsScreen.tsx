import { Icon, StatusBar } from '../../components/Icons';
import { userProfile } from '../../data/mockData';

const FIELDS = [
  { label: 'Shop Name', required: true, value: userProfile.businessName },
  { label: 'Owner Name', required: false, value: userProfile.name },
  { label: 'Mobile Number', required: true, value: userProfile.phone.replace(/^\+91\s?/, '') },
  { label: 'Address', required: true, value: userProfile.location },
  { label: 'GSTIN Number (optional)', required: false, value: userProfile.gst },
];

export default function BusinessDetailsScreen({ onBack }: any) {
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Business Details</h1>
          </div>
        </div>

        <div className="bd-body">
          {FIELDS.map((f) => (
            <div className="bd-field" key={f.label}>
              <div className="bd-label">
                {f.label}
                {f.required && <span className="ob-req">*</span>}
              </div>
              <div className="bd-value">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

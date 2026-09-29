/**
 * Sentinel stored as the sole entry in a State/City/Vendor multi-select array to mean
 * "everything, exclusively" — e.g. state_ids = ["ALL"] rather than every real state id.
 * Keeps "select all" and "every specific item happens to be checked" distinguishable.
 */
export const ALL_ID = 'ALL';

export interface Company {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
  companyId: string;
  categoryId: string;
}

export interface Sku {
  id: string;
  name: string;
  brandId: string;
}

export interface CountryOption {
  id: string;
  name: string;
}

export interface StateOption {
  id: string;
  name: string;
}

export interface CityOption {
  id: string;
  name: string;
  stateId: string;
}

export type PartnerRole = 'distributor' | 'wholesaler';
export type SellerTypeChoice = PartnerRole | 'all';

export interface SellerTypeOption {
  id: SellerTypeChoice;
  label: string;
  description: string;
}

export interface Vendor {
  id: string;
  name: string;
  role: PartnerRole;
  cityId: string;
}

export interface ServiceableArea {
  id: string;
  name: string;
  vendorId: string;
  brandIds: string[];
}

export const companies: Company[] = [
  { id: 'company-itc', name: 'ITC Limited' },
  { id: 'company-adani-wilmar', name: 'Adani Wilmar' },
  { id: 'company-tata-consumer', name: 'Tata Consumer Products' },
  { id: 'company-parle', name: 'Parle Products' },
  { id: 'company-britannia', name: 'Britannia Industries' },
  { id: 'company-colgate-palmolive', name: 'Colgate-Palmolive' },
  { id: 'company-dabur', name: 'Dabur India' },
];

export const categories: Category[] = [
  { id: 'cat-staples', name: 'Staples & Grains' },
  { id: 'cat-edible-oils', name: 'Edible Oils' },
  { id: 'cat-salt-spices', name: 'Salt & Spices' },
  { id: 'cat-snacks', name: 'Snacks & Biscuits' },
  { id: 'cat-personal-care', name: 'Personal Care' },
];

export const brands: Brand[] = [
  { id: 'brand-aashirvaad', name: 'Aashirvaad', companyId: 'company-itc', categoryId: 'cat-staples' },
  { id: 'brand-fortune', name: 'Fortune', companyId: 'company-adani-wilmar', categoryId: 'cat-edible-oils' },
  { id: 'brand-tata-salt', name: 'Tata Salt', companyId: 'company-tata-consumer', categoryId: 'cat-salt-spices' },
  { id: 'brand-tata-sampann', name: 'Tata Sampann', companyId: 'company-tata-consumer', categoryId: 'cat-salt-spices' },
  { id: 'brand-parle', name: 'Parle', companyId: 'company-parle', categoryId: 'cat-snacks' },
  { id: 'brand-britannia', name: 'Britannia', companyId: 'company-britannia', categoryId: 'cat-snacks' },
  { id: 'brand-colgate', name: 'Colgate', companyId: 'company-colgate-palmolive', categoryId: 'cat-personal-care' },
  { id: 'brand-dabur', name: 'Dabur', companyId: 'company-dabur', categoryId: 'cat-personal-care' },
];

export const skus: Sku[] = [
  { id: 'sku-atta-5kg', name: 'Aashirvaad Atta 5kg', brandId: 'brand-aashirvaad' },
  { id: 'sku-atta-10kg', name: 'Aashirvaad Atta 10kg', brandId: 'brand-aashirvaad' },
  { id: 'sku-fortune-oil-1l', name: 'Fortune Sunflower Oil 1L', brandId: 'brand-fortune' },
  { id: 'sku-fortune-oil-5l', name: 'Fortune Sunflower Oil 5L', brandId: 'brand-fortune' },
  { id: 'sku-tata-salt-1kg', name: 'Tata Salt 1kg', brandId: 'brand-tata-salt' },
  { id: 'sku-tata-sampann-toor-dal', name: 'Tata Sampann Toor Dal 1kg', brandId: 'brand-tata-sampann' },
  { id: 'sku-parle-g-biscuit', name: 'Parle-G Biscuit 200g', brandId: 'brand-parle' },
  { id: 'sku-britannia-bread', name: 'Britannia Bread 400g', brandId: 'brand-britannia' },
  { id: 'sku-colgate-toothpaste', name: 'Colgate Toothpaste 150g', brandId: 'brand-colgate' },
  { id: 'sku-dabur-honey', name: 'Dabur Honey 500g', brandId: 'brand-dabur' },
];

export const country: CountryOption = { id: 'country-india', name: 'India' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Source of truth: state name -> its 5 major cities. IDs are derived by slugifying the
// name (e.g. "Andhra Pradesh" -> "state-andhra-pradesh", "Hyderabad" -> "city-hyderabad"),
// so every id below stays stable even as this list grows.
const stateCityCatalog: { name: string; cities: string[] }[] = [
  { name: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada'] },
  { name: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'] },
  { name: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur'] },
  { name: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'] },
  { name: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'] },
  { name: 'Goa', cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'] },
  { name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'] },
  { name: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar'] },
  { name: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'] },
  { name: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'] },
  { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'] },
  { name: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'] },
  { name: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'] },
  { name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
  { name: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'] },
  { name: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara'] },
  { name: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'] },
  { name: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'] },
  { name: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'] },
  { name: 'Punjab', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'] },
  { name: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'] },
  { name: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'] },
  { name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'] },
  { name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'] },
  { name: 'Tripura', cities: ['Agartala', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Khowai'] },
  { name: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'] },
  { name: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Nainital', 'Rishikesh', 'Roorkee'] },
  { name: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'] },
];

export const states: StateOption[] = stateCityCatalog.map((state) => ({ id: `state-${slugify(state.name)}`, name: state.name }));

export const cities: CityOption[] = stateCityCatalog.flatMap((state) =>
  state.cities.map((cityName) => ({ id: `city-${slugify(cityName)}`, name: cityName, stateId: `state-${slugify(state.name)}` })),
);

export const sellerTypeOptions: SellerTypeOption[] = [
  { id: 'all', label: 'All', description: 'Include both distributors and wholesalers.' },
  { id: 'distributor', label: 'Distributor', description: 'Authorized regional distribution partners.' },
  { id: 'wholesaler', label: 'Wholesaler', description: 'Bulk buyers supplying downstream retailers.' },
];

const namedVendors: Vendor[] = [
  { id: 'vendor-hyd-central-dist', name: 'Hyderabad Central Distribution', role: 'distributor', cityId: 'city-hyderabad' },
  { id: 'vendor-hyd-metro-whole', name: 'Hyderabad Metro Wholesale Traders', role: 'wholesaler', cityId: 'city-hyderabad' },
  { id: 'vendor-secunderabad-whole', name: 'Secunderabad Wholesale Hub', role: 'wholesaler', cityId: 'city-hyderabad' },
  { id: 'vendor-warangal-dist', name: 'Warangal Regional Distributors', role: 'distributor', cityId: 'city-warangal' },
  { id: 'vendor-vijayawada-dist', name: 'Vijayawada Central Distribution', role: 'distributor', cityId: 'city-vijayawada' },
  { id: 'vendor-vizag-whole', name: 'Visakhapatnam Wholesale Co.', role: 'wholesaler', cityId: 'city-visakhapatnam' },
  { id: 'vendor-blr-north-dist', name: 'Bengaluru North Distributors', role: 'distributor', cityId: 'city-bengaluru' },
  { id: 'vendor-whitefield-whole', name: 'Whitefield Wholesale Traders', role: 'wholesaler', cityId: 'city-bengaluru' },
  { id: 'vendor-mysuru-dist', name: 'Mysuru City Distribution', role: 'distributor', cityId: 'city-mysuru' },
  { id: 'vendor-chn-east-dist', name: 'Chennai East Trading Co.', role: 'distributor', cityId: 'city-chennai' },
  { id: 'vendor-tnagar-whole', name: 'T Nagar Wholesale Market', role: 'wholesaler', cityId: 'city-chennai' },
  { id: 'vendor-mum-west-dist', name: 'Mumbai West Wholesale', role: 'distributor', cityId: 'city-mumbai' },
  { id: 'vendor-andheri-whole', name: 'Andheri Wholesale Traders', role: 'wholesaler', cityId: 'city-mumbai' },
];

const namedServiceableAreas: ServiceableArea[] = [
  { id: 'area-kukatpally', name: 'Kukatpally Route', vendorId: 'vendor-hyd-central-dist', brandIds: ['brand-fortune', 'brand-aashirvaad', 'brand-colgate'] },
  { id: 'area-secunderabad-fmcg', name: 'Secunderabad FMCG Beat', vendorId: 'vendor-hyd-central-dist', brandIds: ['brand-aashirvaad', 'brand-tata-sampann', 'brand-britannia'] },
  { id: 'area-lb-nagar', name: 'LB Nagar Hub', vendorId: 'vendor-hyd-central-dist', brandIds: ['brand-fortune', 'brand-tata-sampann', 'brand-dabur'] },

  { id: 'area-gachibowli-corridor', name: 'Gachibowli Tech Corridor', vendorId: 'vendor-hyd-metro-whole', brandIds: ['brand-fortune', 'brand-parle', 'brand-colgate'] },
  { id: 'area-madhapur-belt', name: 'Madhapur Tech Belt', vendorId: 'vendor-hyd-metro-whole', brandIds: ['brand-britannia', 'brand-dabur'] },

  { id: 'area-secunderabad-cantonment', name: 'Secunderabad Cantonment', vendorId: 'vendor-secunderabad-whole', brandIds: ['brand-tata-salt', 'brand-tata-sampann'] },
  { id: 'area-trimulgherry-route', name: 'Trimulgherry Route', vendorId: 'vendor-secunderabad-whole', brandIds: ['brand-aashirvaad', 'brand-parle'] },

  { id: 'area-warangal-town', name: 'Warangal Town Route', vendorId: 'vendor-warangal-dist', brandIds: ['brand-fortune', 'brand-tata-salt'] },
  { id: 'area-hanamkonda', name: 'Hanamkonda Beat', vendorId: 'vendor-warangal-dist', brandIds: ['brand-aashirvaad', 'brand-dabur'] },

  { id: 'area-vijayawada-central', name: 'Vijayawada Central Route', vendorId: 'vendor-vijayawada-dist', brandIds: ['brand-fortune', 'brand-colgate'] },
  { id: 'area-governorpet', name: 'Governorpet Beat', vendorId: 'vendor-vijayawada-dist', brandIds: ['brand-tata-sampann', 'brand-britannia'] },

  { id: 'area-vizag-port', name: 'Vizag Port Route', vendorId: 'vendor-vizag-whole', brandIds: ['brand-parle', 'brand-dabur'] },
  { id: 'area-mvp-colony', name: 'MVP Colony Beat', vendorId: 'vendor-vizag-whole', brandIds: ['brand-aashirvaad', 'brand-tata-salt'] },

  { id: 'area-hebbal-route', name: 'Hebbal Route', vendorId: 'vendor-blr-north-dist', brandIds: ['brand-fortune', 'brand-britannia'] },
  { id: 'area-yelahanka-beat', name: 'Yelahanka Beat', vendorId: 'vendor-blr-north-dist', brandIds: ['brand-colgate', 'brand-dabur'] },

  { id: 'area-whitefield-tech-route', name: 'Whitefield Tech Route', vendorId: 'vendor-whitefield-whole', brandIds: ['brand-tata-sampann', 'brand-parle'] },
  { id: 'area-itpl-beat', name: 'ITPL Beat', vendorId: 'vendor-whitefield-whole', brandIds: ['brand-aashirvaad', 'brand-fortune'] },

  { id: 'area-mysuru-city-route', name: 'Mysuru City Route', vendorId: 'vendor-mysuru-dist', brandIds: ['brand-tata-salt', 'brand-britannia'] },

  { id: 'area-t-nagar-route', name: 'T Nagar Route', vendorId: 'vendor-chn-east-dist', brandIds: ['brand-fortune', 'brand-colgate'] },
  { id: 'area-adyar-beat', name: 'Adyar Beat', vendorId: 'vendor-chn-east-dist', brandIds: ['brand-aashirvaad', 'brand-dabur'] },

  { id: 'area-pondy-bazaar', name: 'Pondy Bazaar Route', vendorId: 'vendor-tnagar-whole', brandIds: ['brand-tata-sampann', 'brand-parle'] },

  { id: 'area-andheri-route', name: 'Andheri Route', vendorId: 'vendor-mum-west-dist', brandIds: ['brand-fortune', 'brand-tata-salt'] },
  { id: 'area-malad-beat', name: 'Malad Beat', vendorId: 'vendor-mum-west-dist', brandIds: ['brand-britannia', 'brand-colgate'] },

  { id: 'area-andheri-east-belt', name: 'Andheri East Belt', vendorId: 'vendor-andheri-whole', brandIds: ['brand-aashirvaad', 'brand-tata-sampann'] },
];

// The five states above (Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, Maharashtra) have
// hand-authored vendor/area detail. Every other state gets one Distributor + one Wholesaler in
// its primary city, generated here, so geographic vendor filtering has real coverage nationwide
// instead of only returning results for those five states.
const primaryCityVendorSeeds: { cityName: string; distributorName: string; wholesalerName: string }[] = [
  { cityName: 'Itanagar', distributorName: 'Itanagar Hill Distribution', wholesalerName: 'Papum Pare Wholesale Traders' },
  { cityName: 'Guwahati', distributorName: 'Guwahati Gateway Distribution', wholesalerName: 'Kamrup Wholesale Traders' },
  { cityName: 'Patna', distributorName: 'Patna Ganga Distribution', wholesalerName: 'Patliputra Wholesale Traders' },
  { cityName: 'Raipur', distributorName: 'Raipur Central Distribution', wholesalerName: 'Chhattisgarh Wholesale Traders' },
  { cityName: 'Panaji', distributorName: 'Panaji Coastal Distribution', wholesalerName: 'Goa Wholesale Traders' },
  { cityName: 'Ahmedabad', distributorName: 'Ahmedabad Sabarmati Distribution', wholesalerName: 'Gujarat Wholesale Traders' },
  { cityName: 'Gurugram', distributorName: 'Gurugram Corporate Distribution', wholesalerName: 'Haryana Wholesale Traders' },
  { cityName: 'Shimla', distributorName: 'Shimla Hill Distribution', wholesalerName: 'Himachal Wholesale Traders' },
  { cityName: 'Ranchi', distributorName: 'Ranchi Plateau Distribution', wholesalerName: 'Jharkhand Wholesale Traders' },
  { cityName: 'Kochi', distributorName: 'Kochi Backwater Distribution', wholesalerName: 'Ernakulam Wholesale Traders' },
  { cityName: 'Bhopal', distributorName: 'Bhopal Lakes Distribution', wholesalerName: 'Madhya Pradesh Wholesale Traders' },
  { cityName: 'Imphal', distributorName: 'Imphal Valley Distribution', wholesalerName: 'Manipur Wholesale Traders' },
  { cityName: 'Shillong', distributorName: 'Shillong Hills Distribution', wholesalerName: 'Meghalaya Wholesale Traders' },
  { cityName: 'Aizawl', distributorName: 'Aizawl Ridge Distribution', wholesalerName: 'Mizoram Wholesale Traders' },
  { cityName: 'Kohima', distributorName: 'Kohima Highland Distribution', wholesalerName: 'Nagaland Wholesale Traders' },
  { cityName: 'Bhubaneswar', distributorName: 'Bhubaneswar Temple City Distribution', wholesalerName: 'Odisha Wholesale Traders' },
  { cityName: 'Ludhiana', distributorName: 'Ludhiana Industrial Distribution', wholesalerName: 'Punjab Wholesale Traders' },
  { cityName: 'Jaipur', distributorName: 'Jaipur Pink City Distribution', wholesalerName: 'Rajasthan Wholesale Traders' },
  { cityName: 'Gangtok', distributorName: 'Gangtok Ridge Distribution', wholesalerName: 'Sikkim Wholesale Traders' },
  { cityName: 'Agartala', distributorName: 'Agartala Central Distribution', wholesalerName: 'Tripura Wholesale Traders' },
  { cityName: 'Lucknow', distributorName: 'Lucknow Nawabi Distribution', wholesalerName: 'Uttar Pradesh Wholesale Traders' },
  { cityName: 'Dehradun', distributorName: 'Dehradun Valley Distribution', wholesalerName: 'Uttarakhand Wholesale Traders' },
  { cityName: 'Kolkata', distributorName: 'Kolkata Howrah Distribution', wholesalerName: 'West Bengal Wholesale Traders' },
];

const brandRotation = brands.map((brand) => brand.id);

const generatedVendors: Vendor[] = [];
const generatedServiceableAreas: ServiceableArea[] = [];

primaryCityVendorSeeds.forEach((seed, index) => {
  const citySlug = slugify(seed.cityName);
  const cityId = `city-${citySlug}`;
  const distributorId = `vendor-${citySlug}-dist`;
  const wholesalerId = `vendor-${citySlug}-whole`;
  const brandA = brandRotation[(index * 2) % brandRotation.length];
  const brandB = brandRotation[(index * 2 + 1) % brandRotation.length];

  generatedVendors.push(
    { id: distributorId, name: seed.distributorName, role: 'distributor', cityId },
    { id: wholesalerId, name: seed.wholesalerName, role: 'wholesaler', cityId },
  );

  generatedServiceableAreas.push(
    { id: `area-${citySlug}-central-route`, name: `${seed.cityName} Central Route`, vendorId: distributorId, brandIds: [brandA, brandB] },
    { id: `area-${citySlug}-market-beat`, name: `${seed.cityName} Market Beat`, vendorId: wholesalerId, brandIds: [brandB, brandA] },
  );
});

export const vendors: Vendor[] = [...namedVendors, ...generatedVendors];
export const serviceableAreas: ServiceableArea[] = [...namedServiceableAreas, ...generatedServiceableAreas];

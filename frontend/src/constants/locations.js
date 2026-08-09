/** Country → state/province lists for profile location fields. */

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const CANADA_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const AUSTRALIA_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

const UK_REGIONS = [
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland",
];

const UAE_EMIRATES = [
  "Abu Dhabi",
  "Ajman",
  "Dubai",
  "Fujairah",
  "Ras Al Khaimah",
  "Sharjah",
  "Umm Al Quwain",
];

const PAKISTAN_STATES = [
  "Azad Jammu and Kashmir",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
  "Khyber Pakhtunkhwa",
  "Punjab",
  "Sindh",
];

const BANGLADESH_DIVISIONS = [
  "Barishal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
];

const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

const SRI_LANKA_PROVINCES = [
  "Central",
  "Eastern",
  "North Central",
  "Northern",
  "North Western",
  "Sabaragamuwa",
  "Southern",
  "Uva",
  "Western",
];

const SOUTH_AFRICA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const GERMANY_STATES = [
  "Baden-Württemberg",
  "Bavaria",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hesse",
  "Lower Saxony",
  "Mecklenburg-Vorpommern",
  "North Rhine-Westphalia",
  "Rhineland-Palatinate",
  "Saarland",
  "Saxony",
  "Saxony-Anhalt",
  "Schleswig-Holstein",
  "Thuringia",
];

/** Countries with predefined subdivisions. Sorted A–Z by name. */
export const LOCATION_COUNTRIES = [
  { name: "Australia", states: AUSTRALIA_STATES },
  { name: "Bangladesh", states: BANGLADESH_DIVISIONS },
  { name: "Canada", states: CANADA_PROVINCES },
  { name: "Germany", states: GERMANY_STATES },
  { name: "India", states: INDIA_STATES },
  { name: "Nepal", states: NEPAL_PROVINCES },
  { name: "Pakistan", states: PAKISTAN_STATES },
  { name: "Singapore", states: ["Singapore"] },
  { name: "South Africa", states: SOUTH_AFRICA_PROVINCES },
  { name: "Sri Lanka", states: SRI_LANKA_PROVINCES },
  { name: "United Arab Emirates", states: UAE_EMIRATES },
  { name: "United Kingdom", states: UK_REGIONS },
  { name: "United States", states: US_STATES },
].map((entry) => ({
  ...entry,
  states: [...entry.states].sort((a, b) => a.localeCompare(b)),
}));

export const COUNTRY_NAMES = LOCATION_COUNTRIES.map((c) => c.name);

export const getStatesForCountry = (country) => {
  const name = String(country || "").trim();
  if (!name) return [];
  const match = LOCATION_COUNTRIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return match ? match.states : [];
};

export const normalizeCountryName = (country) => {
  const name = String(country || "").trim();
  if (!name) return "";
  const match = LOCATION_COUNTRIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return match ? match.name : name;
};


import { Bill } from "@/types";

export const mockBills: Bill[] = [
  {
    id: "SB-0001",
    title: "Illinois Renewable Energy Expansion Act",
    description: "Expands incentives for solar and wind energy projects across Illinois. The bill aims to provide tax credits to homeowners and businesses investing in renewable energy infrastructure.",
    lastUpdated: "2023-03-15",
    status: "In Committee",
    versions: [
      {
        id: "v1",
        name: "Introduced",
        status: "Initial",
        date: "2023-01-10",
        sections: [
          {
            id: "s1",
            title: "Section 1: Renewable Energy Tax Credit",
            content: "To encourage the expansion of renewable energy infrastructure, the state will provide a 25% tax credit on solar and wind energy installations for homeowners and businesses."
          },
          {
            id: "s2",
            title: "Section 2: Funding",
            content: "A renewable energy fund of $400M will be established to support implementation."
          }
        ]
      },
      {
        id: "v2",
        name: "Engrossed",
        status: "Amended",
        date: "2023-02-28",
        sections: [
          {
            id: "s1",
            title: "Section 1: Renewable Energy Tax Credit",
            content: "To encourage the expansion of renewable energy infrastructure, the state will provide a 30% tax credit on solar and wind energy installations for homeowners and businesses."
          },
          {
            id: "s2",
            title: "Section 2: Funding",
            content: "A renewable energy fund of $500M will be established to support implementation."
          },
          {
            id: "s3",
            title: "Section 3: Workforce Development",
            content: "Added Workforce Training Program to ensure skilled labor for renewable installation and maintenance."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Amendment 1 – Increased tax credit from 25% to 30% ($1)."
      },
      {
        id: "c2",
        description: "Amendment 2 – Increased renewable energy fund from $400M to $500M ($2)."
      },
      {
        id: "c3",
        description: "Amendment 3 – Added Workforce Training Program ($3)."
      }
    ]
  },
  {
    id: "SB-0002",
    title: "Fair Housing Protections Enhancement",
    description: "Strengthens tenant rights by limiting rental increases and enforcing stricter anti-discrimination policies. The bill also introduces a fund to assist renters facing sudden displacement.",
    lastUpdated: "2023-02-20",
    status: "Passed Senate",
    versions: [
      {
        id: "v1",
        name: "Introduced",
        status: "Initial",
        date: "2023-01-05",
        sections: [
          {
            id: "s1",
            title: "Section 1: Rental Increase Caps",
            content: "Annual rental increases shall not exceed 5% plus inflation, capped at 10% total."
          }
        ]
      }
    ],
    changes: []
  },
  {
    id: "SB-0003",
    title: "Public School Teacher Salary Reform",
    description: "Increases the minimum salary for public school teachers to $50,000 statewide by 2027. This initiative is aimed at addressing teacher shortages and ensuring competitive wages in education.",
    lastUpdated: "2023-04-10",
    status: "Passed House",
    versions: [
      {
        id: "v1",
        name: "Introduced",
        status: "Initial",
        date: "2023-02-01",
        sections: [
          {
            id: "s1",
            title: "Section 1: Minimum Salary Requirements",
            content: "Establishes a minimum salary of $50,000 for all full-time public school teachers by 2027."
          }
        ]
      }
    ],
    changes: []
  }
];

export const getSearchResults = (
  query: string = "",
  page: number = 1,
  pageSize: number = 3
): { bills: Bill[]; totalPages: number; currentPage: number } => {
  const filteredBills = query
    ? mockBills.filter(
        (bill) =>
          bill.title.toLowerCase().includes(query.toLowerCase()) ||
          bill.description.toLowerCase().includes(query.toLowerCase())
      )
    : mockBills;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedBills = filteredBills.slice(start, end);
  const totalPages = Math.ceil(filteredBills.length / pageSize);

  return {
    bills: paginatedBills,
    totalPages,
    currentPage: page,
  };
};

export const getBillById = (id: string): Bill | undefined => {
  return mockBills.find((bill) => bill.id === id);
};

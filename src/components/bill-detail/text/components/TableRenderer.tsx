
import { Element, domToReact, HTMLReactParserOptions, DOMNode } from 'html-react-parser';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableRendererProps {
  node: Element;
  options: HTMLReactParserOptions;
}

const TableRenderer = ({ node, options }: TableRendererProps) => {
  return (
    <div className="overflow-x-auto mb-4">
      <Table>
        <TableHeader>
          {node.children.find((child) => {
            return child instanceof Element && child.name === 'tr';
          }) && (
            <TableRow>
              {Array.from(node.children)
                .filter((child): child is Element => 
                  child instanceof Element && child.name === 'tr'
                )[0]
                .children
                .filter((cell): cell is Element => 
                  cell instanceof Element && (cell.name === 'td' || cell.name === 'th')
                )
                .map((cell, i) => (
                  <TableHead key={i}>
                    {domToReact(
                      cell instanceof Element && cell.children ? 
                        Array.from(cell.children).filter((node): node is DOMNode => 
                          node instanceof Element || typeof node === 'string'
                        ) : 
                        [], 
                      options
                    ) || '\u00A0'}
                  </TableHead>
                ))}
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {Array.from(node.children)
            .filter((child): child is Element => 
              child instanceof Element && child.name === 'tr'
            )
            .slice(1) // Skip the first row as it's used for header
            .map((row, i) => (
              <TableRow key={i}>
                {Array.from(row.children)
                  .filter((cell): cell is Element => 
                    cell instanceof Element && (cell.name === 'td' || cell.name === 'th')
                  )
                  .map((cell, j) => (
                    <TableCell key={j}>
                      {domToReact(
                        cell instanceof Element && cell.children ? 
                          Array.from(cell.children).filter((node): node is DOMNode => 
                            node instanceof Element || typeof node === 'string'
                          ) : 
                          [], 
                        options
                      ) || '\u00A0'}
                    </TableCell>
                  ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableRenderer;

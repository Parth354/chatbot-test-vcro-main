import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  onCopy?: () => void
}

const CodeBlock = ({ code, language = "html", onCopy }: CodeBlockProps) => {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase font-mono">
          {language}
        </span>
        {onCopy && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="gap-2 h-8"
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        )}
      </div>
      <div className="relative">
        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border">
          <code className="font-mono text-foreground">
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
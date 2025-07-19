import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CodeBlock from "./CodeBlock"

interface DeployTabProps {
  agentId: string
}

const DeployTab = ({ agentId }: DeployTabProps) => {
  const { toast } = useToast()
  const [iframeWidth, setIframeWidth] = useState("400")
  const [iframeHeight, setIframeHeight] = useState("600")
  
  // Get chatbot base URL from environment variable or use current domain
  const chatbotBaseUrl = import.meta.env.VITE_CHATBOT_URL || window.location.origin;
  
  // URLs and code snippets
  const directLink = `${chatbotBaseUrl}/embed/${agentId}`
  const scriptCode = `<script defer src="${chatbotBaseUrl}/embed.js" data-bot-id="${agentId}"></script>`
  const iframeCode = `<iframe style="width: ${iframeWidth}px; height: ${iframeHeight}px;" src="${chatbotBaseUrl}/iframe/${agentId}"></iframe>`

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the text manually",
        variant: "destructive"
      })
    }
  }

  const openDirectLink = () => {
    try {
      window.open(directLink, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({
        title: "Failed to open link",
        description: "Please copy and paste the URL manually",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Direct Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Direct Link
          </CardTitle>
          <CardDescription>
            Share a direct link to your chatbot. Users can access it immediately without any setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chatbot URL</Label>
            <div className="flex gap-2">
              <Input
                value={directLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(directLink, "Direct link")}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={openDirectLink}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Script Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add to a Website</CardTitle>
          <CardDescription>
            Add the code below to the header of your website to display the chatbot on all pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            code={scriptCode}
            language="html"
            onCopy={() => copyToClipboard(scriptCode, "Website script")}
          />
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Installation Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the script tag above</li>
              <li>Paste it in the &lt;head&gt; section of your website</li>
              <li>The chatbot will appear automatically on all pages</li>
              <li>Multiple chatbots can be embedded on the same page using different bot IDs</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Iframe Section */}
      <Card>
        <CardHeader>
          <CardTitle>Display Inside Webpage</CardTitle>
          <CardDescription>
            Display the open chatbot window inside a webpage with an iframe, ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={iframeWidth}
                onChange={(e) => setIframeWidth(e.target.value)}
                min="200"
                max="800"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={iframeHeight}
                onChange={(e) => setIframeHeight(e.target.value)}
                min="300"
                max="1000"
              />
            </div>
          </div>
          
          <CodeBlock
            code={iframeCode}
            language="html"
            onCopy={() => copyToClipboard(iframeCode, "Iframe code")}
          />
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Usage Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Adjust width and height to fit your layout</li>
              <li>The chatbot will be displayed in an expanded state</li>
              <li>Recommended minimum size: 400x600 pixels</li>
              <li>The iframe is responsive and will adapt to smaller screens</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DeployTab
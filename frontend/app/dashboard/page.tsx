import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, PenSquare, CheckCircle, TrendingUp, ArrowRight, Zap, Activity, Coins, Radar, MapPin, Users } from "lucide-react"

const quickActions = [
  {
    title: "MLAT Tracking",
    description: "Real-time aircraft tracking with AI-powered analysis",
    href: "/mlat",
    icon: Radar,
    primary: true,
  },
  {
    title: "Flight Intelligence",
    description: "AI analysis of aircraft patterns and anomalies",
    href: "/mlat",
    icon: Zap,
  },
  {
    title: "Sensor Network",
    description: "Manage Neuron sensor nodes and coverage areas",
    href: "/dashboard/sensors",
    icon: MapPin,
  },
  {
    title: "User Analytics",
    description: "Track user activity and system performance",
    href: "/dashboard/analytics",
    icon: TrendingUp,
  },
]

const stats = [
  { label: "Aircraft Tracked", value: "147", icon: Radar, change: "+24%" },
  { label: "Active Sensors", value: "12", icon: MapPin, change: "+2" },
  { label: "AI Queries", value: "3,847", icon: Zap, change: "+156%" },
  { label: "System Users", value: "89", icon: Users, change: "+12%" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to AircraftWorth Mission Control
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time aircraft tracking powered by MLAT technology and AI intelligence.
        </p>
      </div>

      {/* Featured MLAT Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Radar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Live MLAT Tracking</h3>
                <p className="text-muted-foreground">Monitor real-time aircraft with AI-powered analysis</p>
              </div>
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/mlat">
                Launch Tracking
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground font-mono">{stat.value}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-success font-mono">{stat.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className={`group bg-card border-border hover:border-primary/30 transition-colors ${action.primary ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${action.primary ? 'bg-primary/20' : 'bg-primary/10'} flex items-center justify-center mb-2 transition-colors group-hover:bg-primary/20`}>
                    <action.icon className={`w-5 h-5 ${action.primary ? 'text-primary' : 'text-primary'}`} />
                  </div>
                  {action.primary && (
                    <div className="px-2 py-1 bg-primary/20 rounded-full">
                      <span className="text-xs text-primary font-semibold">Featured</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg text-foreground">{action.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant={action.primary ? "default" : "ghost"} className={`p-0 h-auto ${action.primary ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-primary hover:text-primary/80 hover:bg-transparent'}`}>
                  <Link href={action.href} className="flex items-center gap-1">
                    <span>{action.primary ? 'Launch' : 'Open'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">System Status</CardTitle>
          <CardDescription>Real-time status of AircraftWorth infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Groq API</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Hedera HCS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Hedera HTS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">Smart Contracts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

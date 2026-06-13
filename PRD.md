# Aurora Capital - Autonomous Investment AI System

Aurora Capital is an autonomous investment AI system composed of multiple specialized agents that collaborate to analyze markets, assess risk, and execute investment decisions with sophisticated safeguards.

**Experience Qualities**:
1. **Commanding** - The interface projects authority and precision, conveying the gravity of autonomous financial decision-making through bold hierarchies and decisive visual language.
2. **Hyper-intelligent** - Every element communicates advanced computational sophistication through data-dense displays, real-time metrics, and algorithmic transparency.
3. **Vigilant** - The system emphasizes constant monitoring and protective mechanisms, with the Survival Agent's veto authority visually reinforced as the ultimate safeguard.

**Complexity Level**: Complex Application (advanced functionality with multiple views)
This is a sophisticated multi-agent AI system that simulates autonomous investment decision-making. It requires real-time data visualization, agent coordination logic, historical tracking, reputation scoring, risk management displays, and simulation capabilities across multiple interconnected views.

## Essential Features

### Multi-Agent AI System
**Functionality**: Seven specialized AI agents that analyze different aspects of investment decisions (News, Technical, Risk, Survival, Archivist, Investor, Director)
**Purpose**: Provides distributed intelligence with checks and balances, mimicking institutional investment committee structure
**Trigger**: Agents continuously analyze data; proposals are generated and evaluated in sequence
**Progression**: News + Technical analysis → Risk calculation → Investor proposal → Survival veto check → Director decision → Archivist logging → Execution or rejection
**Success criteria**: Each agent displays current status, analysis output, and reputation score; decision flow is transparent and traceable

### Survival Agent Veto Authority
**Functionality**: The Survival Agent monitors a protected capital reserve and has absolute authority to block any operation that threatens minimum reserves
**Purpose**: Critical safeguard ensuring the system cannot deplete capital below survival threshold
**Trigger**: Automatically evaluates every investment proposal before execution
**Progression**: Proposal created → Survival Agent checks reserve impact → Veto displayed if threshold breached → Operation blocked
**Success criteria**: Veto status clearly visible; no operation executes if Survival Agent blocks it; reserve percentage always displayed

### Capital Dashboard
**Functionality**: Real-time display of total capital, operating capital, survival reserve, distribution breakdown, and performance chart
**Purpose**: Provides immediate financial status overview and health metrics
**Trigger**: Loads on application start; updates with each operation
**Progression**: User views dashboard → Capital metrics displayed → Performance chart shows trend → Distribution pie chart shows allocation
**Success criteria**: All capital figures accurate; positive/negative changes color-coded; percentage allocations sum to 100%

### Agent Reputation System
**Functionality**: Each agent has a reputation score (0-100) based on historical performance of their recommendations
**Purpose**: Tracks agent reliability over time; influences decision weighting
**Trigger**: Updates after each operation based on outcome
**Progression**: Operation completes → Outcome compared to agent predictions → Reputation adjusted → New score displayed
**Success criteria**: Scores persist between sessions; visible on dashboard and agent detail views; influence decision-making

### Operation History Log
**Functionality**: Chronological record of all investment operations with details (date, asset, action, amount, result, confidence, agent votes)
**Purpose**: Provides audit trail and learning data for the system
**Trigger**: User navigates to History view or dashboard displays recent operations
**Progression**: User views history → Operations listed chronologically → User clicks operation → Detailed breakdown shown
**Success criteria**: All operations logged with complete metadata; searchable/filterable; persists between sessions

### Market Analysis Panel
**Functionality**: Displays current market sentiment, active positions, recent news, technical indicators, and global market metrics
**Purpose**: Provides context for agent decision-making and user oversight
**Trigger**: Continuously updates on Market view
**Progression**: User views market panel → Sentiment displayed → Active positions shown → News feed updates → Technical sparklines render
**Success criteria**: Data refreshes regularly; sentiment reflects multiple timeframes; positions show current P&L

### Investment Proposal System
**Functionality**: Displays current investment proposal with details (asset, action, amount, confidence, risk assessment, agent votes) and Director's pending decision
**Purpose**: Makes the decision-making process transparent and allows monitoring of proposal evaluation
**Trigger**: Investor Agent creates proposal based on market conditions
**Progression**: Proposal generated → Agents vote/analyze → Survival check → Director evaluates → Decision rendered → Execution or rejection
**Success criteria**: Proposal details comprehensive; agent inputs visible; Survival veto clearly marked; decision rationale provided

### Consensus Engine
**Functionality**: Mathematical voting system that calculates final decisions using Influence × Reputation × Confidence for each agent, with comprehensive veto rules and full calculation breakdown
**Purpose**: Provides transparent, weighted decision-making that accounts for agent expertise, historical performance, and confidence levels
**Trigger**: User runs consensus simulation or system evaluates proposal
**Progression**: Proposal created → Each agent generates vote with confidence → Engine calculates weighted scores (normalizing influence, reputation, confidence) → Veto rules evaluated → Final consensus score computed → Decision explanation generated → Mathematical breakdown displayed
**Success criteria**: Shows complete calculation breakdown for every agent; displays veto rule status; provides human-readable explanation; mathematical summary visible with all formulas and intermediate steps; consensus score accurately reflects weighted voting

### Simulation Mode
**Functionality**: Toggle to run system without real capital at risk; uses virtual starting balance
**Purpose**: Allows testing strategies and agent tuning without financial risk
**Trigger**: User toggles simulation mode in settings
**Progression**: User enables simulation → System switches to virtual capital → Operations execute in sandbox → Results tracked separately
**Success criteria**: Mode clearly indicated in UI; capital clearly marked as simulated; history separates real/simulated

### Telegram Integration Placeholder
**Functionality**: Shows connection status and configuration panel for Telegram bot notifications
**Purpose**: Prepares for future feature where system sends alerts and reports via Telegram
**Trigger**: User views Settings or Integration panel
**Progression**: User views Telegram panel → Connection status shown → Configuration options displayed → Connect button available
**Success criteria**: Status indicator present; placeholder config fields shown; indicates "not connected" state

## Edge Case Handling

- **Insufficient Capital**: Risk Agent prevents proposals exceeding available capital; warning displayed
- **Survival Reserve Breach**: Survival Agent veto immediately blocks operation; critical alert shown
- **Agent Consensus Failure**: Director makes decision even with split agent recommendations; logs dissent
- **No Market Data**: Agents display "awaiting data" status; proposals paused until data available
- **Reputation Floor**: Agent reputation cannot drop below 0 or exceed 100; clamped at boundaries
- **Concurrent Operations**: System queues proposals; processes one at a time; displays queue status
- **Historical Data Loss**: Graceful fallback to empty state; system continues operating

## Design Direction

The design should evoke a classified intelligence command center - where advanced AI systems analyze global markets with precision and autonomy. The aesthetic combines financial terminal aesthetics with sci-fi interface design, emphasizing data density, real-time updates, glowing accents, and a sense of algorithmic superintelligence at work. Users should feel they're overseeing a sophisticated autonomous entity with powerful safeguards.

## Color Selection

A dark, high-contrast color scheme inspired by terminal interfaces and holographic displays, with vibrant accent colors for status indicators and critical alerts.

- **Primary Color**: Electric Cyan `oklch(0.75 0.15 210)` - Represents AI intelligence and technological sophistication; used for key interactive elements and primary actions
- **Secondary Colors**: 
  - Deep Space Navy `oklch(0.15 0.02 250)` - Background foundation conveying depth and focus
  - Slate Gray `oklch(0.25 0.01 250)` - Card and surface backgrounds
  - Neon Purple `oklch(0.65 0.20 300)` - Represents the Survival Agent and critical warnings
- **Accent Color**: Aurora Green `oklch(0.70 0.18 150)` - Success states, positive trends, approved operations
- **Foreground/Background Pairings**: 
  - Background (Deep Navy #0A0E1A): Cyan text (#3DD9D9) - Ratio 9.2:1 ✓
  - Card (Slate #1A1F2E): White text (#E8EDF5) - Ratio 12.8:1 ✓
  - Primary (Electric Cyan #3DD9D9): Deep Navy text (#0A0E1A) - Ratio 9.2:1 ✓
  - Accent (Aurora Green #47E0A0): Deep Navy text (#0A0E1A) - Ratio 8.5:1 ✓
  - Alert (Neon Purple #B03DFF): White text (#FFFFFF) - Ratio 5.2:1 ✓

## Font Selection

Typefaces should convey technical precision and futuristic sophistication while maintaining exceptional readability for data-dense displays.

- **Primary Font**: Orbitron (700 for headings, 600 for labels) - Geometric futuristic typeface that reinforces AI/tech aesthetic
- **Data Font**: JetBrains Mono (500 for numbers/metrics) - Monospace font for precise numerical data alignment
- **Body Font**: Space Grotesk (400 for body, 500 for emphasis) - Technical yet approachable for longer text content

**Typographic Hierarchy**:
- System Title (AURORA CAPITAL): Orbitron Bold/32px/tight letter-spacing
- Section Headers: Orbitron SemiBold/18px/uppercase/wide letter-spacing
- Agent Names: Space Grotesk Medium/16px
- Metric Values: JetBrains Mono Medium/24-28px/tabular numbers
- Metric Labels: Space Grotesk Regular/12px/uppercase/tracking-wide
- Body Text: Space Grotesk Regular/14px/line-height 1.6

## Animations

Animations should emphasize real-time processing, data flow, and system responsiveness with subtle pulsing for active states and smooth transitions for status changes.

- **Agent Status Indicators**: Gentle pulse (2s) on "Activo" badges to show continuous processing
- **Proposal Evaluation**: Progress ring animation (1s ease-out) when confidence/risk meters update
- **Veto Alert**: Attention-grabbing shake animation (0.3s) when Survival Agent blocks operation
- **Data Updates**: Smooth number counter animations (0.5s) when metrics change
- **Panel Transitions**: Slide-in from right (0.3s ease-out) for detail views
- **Chart Updates**: Animated path drawing (0.8s) for performance graphs
- **Success/Failure**: Scale + fade (0.4s) for operation result indicators

## Component Selection

**Components**:
- **Tabs**: Navigation between Dashboard, Market, Agents, History, Settings views
- **Card**: Containers for capital metrics, agent status, proposals, market data panels
- **Badge**: Agent status indicators, operation types, system state labels
- **Button**: Action triggers (simulate operation, configure settings, view details)
- **Progress**: Agent reputation bars, survival reserve meter, confidence indicators
- **Table**: Operation history log with sortable columns
- **Separator**: Visual dividers between dashboard sections
- **Dialog**: Agent detail views, operation details, confirmation modals
- **Switch**: Toggle simulation mode, enable/disable notifications
- **Avatar**: Agent icons with status indicators
- **Tooltip**: Hover explanations for metrics and agent recommendations
- **ScrollArea**: History logs, news feeds with smooth scrolling

**Customizations**:
- Custom hexagonal agent status cards with glowing borders
- Custom circular gauge component for Survival Agent health indicator
- Custom sparkline charts for asset price trends
- Custom proposal evaluation flow visualization
- Gradient overlays on cards for depth (using cyan/purple/green)
- Custom animated status badges with pulse effects

**States**:
- Buttons: Default (cyan border), Hover (cyan fill), Disabled (50% opacity), Active (bright glow)
- Agent Cards: Normal (subtle glow), Active processing (animated border), Alert (red pulse), Success (green glow)
- Proposal Status: Pending (yellow), Approved (green), Vetoed (red), Executed (blue)
- Input Focus: Cyan glow ring expanding from border

**Icon Selection**:
- Brain (Agent intelligence)
- Newspaper (News Agent)
- ChartLine (Technical Agent)
- ShieldCheck (Risk Agent)
- HeartPulse (Survival Agent)
- Archive (Archivist Agent)
- Coins (Investor Agent)
- Crown (Director Agent)
- TrendUp/TrendDown (Market direction)
- ArrowsClockwise (Simulation mode)
- Bell (Notifications)
- Telegram logo for integration

**Spacing**:
- Page padding: p-6 (24px)
- Card padding: p-6 for main cards, p-4 for nested cards
- Section gaps: gap-6 between major sections
- Grid gaps: gap-4 for card grids
- Element spacing: space-y-2 for stacked labels/values, space-x-4 for inline groups

**Mobile**:
- Navigation tabs convert to bottom navigation bar
- Multi-column dashboard stacks to single column
- Agent grid reduces from 3-4 columns to 1-2 columns
- Proposal panel becomes full-width drawer from bottom
- Capital metrics stack vertically with larger tap targets
- Charts resize to full container width with maintained aspect ratio
- History table converts to card list view with expandable details

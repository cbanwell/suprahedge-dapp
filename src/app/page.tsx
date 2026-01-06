'use client'

// DeltaZero App Page — functional mock (env-safe)
// Fix: Avoid direct `process.env` access in the browser to prevent
// "ReferenceError: process is not defined". Read NEXT_PUBLIC_* vars safely.
//
// ✅ What you need in `.env.local` (Next.js will inline at build):
// NEXT_PUBLIC_SUPRA_RPC=https://rpc.supra.com
// NEXT_PUBLIC_VAULT_ADDRESS=0xYourVault
// NEXT_PUBLIC_USDC_ADDRESS=0xYourUsdc
//
// If these are missing, the page renders with actions disabled and shows hints.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    createPublicClient,
    createWalletClient,
    http,
    custom,
    parseUnits,
    type WalletClient,
} from 'viem'

// -----------------------------
// Safe env access (works client & server)
// -----------------------------
interface ProcessEnv {
    env?: Record<string, string | undefined>
}

interface GlobalEnv {
    __ENV__?: Record<string, string | undefined>
    __NEXT_PUBLIC__?: Record<string, string | undefined>
    [key: string]: unknown
}

function readPublicEnv(key: string): string | undefined {
    // 1) Build-time inlined by Next.js (safe-guarded)
    try {
        if (typeof process !== 'undefined') {
            const proc = process as ProcessEnv
            if (proc.env) {
                const v = proc.env[key]
                if (typeof v === 'string' && v.length) return v
            }
        }
    } catch { }
    // 2) Optional runtime injection (window.__ENV__ or globals)
    try {
        const g = globalThis as GlobalEnv
        const envValue = g?.__ENV__?.[key]
        if (envValue && typeof envValue === 'string' && envValue.length) return envValue
        const nextPublicValue = g?.__NEXT_PUBLIC__?.[key]
        if (nextPublicValue && typeof nextPublicValue === 'string' && nextPublicValue.length) return nextPublicValue
        const directValue = g?.[key]
        if (directValue && typeof directValue === 'string' && directValue.length) return directValue
    } catch { }
    return undefined
}

const RPC = readPublicEnv('NEXT_PUBLIC_SUPRA_RPC') ?? 'https://rpc.supra.com'
const VAULT_ADDR_RAW = readPublicEnv('NEXT_PUBLIC_VAULT_ADDRESS') ?? ''
const USDC_ADDR_RAW = readPublicEnv('NEXT_PUBLIC_USDC_ADDRESS') ?? ''
const VAULT_ADDR = VAULT_ADDR_RAW.toLowerCase()
const USDC_ADDR = USDC_ADDR_RAW.toLowerCase()

// -----------------------------
// Clients
// -----------------------------
const publicClient = createPublicClient({ transport: http(RPC) })

// -----------------------------
// Minimal ABIs
// -----------------------------
const abiVault = [
    { name: 'totalAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
    { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { name: 'redeem', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }, { name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

const abiErc20 = [
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
    { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
    { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const

// -----------------------------
// Wallet hook (injected EVM + viem)
// -----------------------------
function useWallet() {
    const [address, setAddress] = useState<string | undefined>()
    const [wallet, setWallet] = useState<WalletClient | undefined>()
    const [chainId, setChainId] = useState<number | undefined>()
    const [error, setError] = useState<string | undefined>()

    const connect = useCallback(async () => {
        setError(undefined)
        interface EthereumProvider {
            request: (args: { method: string }) => Promise<string[] | string>
        }
        const eth = (globalThis as { ethereum?: EthereumProvider }).ethereum
        if (!eth) { setError('No injected wallet found'); return }
        const wc = createWalletClient({ transport: custom(eth) })
        setWallet(wc)
        const [addr] = await eth.request({ method: 'eth_requestAccounts' }) as string[]
        setAddress(addr)
        try {
            const chainIdResult = await eth.request({ method: 'eth_chainId' })
            const chainIdStr = Array.isArray(chainIdResult) ? chainIdResult[0] : chainIdResult
            setChainId(parseInt(chainIdStr, 16))
        } catch { }
    }, [])

    const disconnect = useCallback(() => {
        setAddress(undefined); setWallet(undefined)
    }, [])

    return { address, wallet, chainId, connect, disconnect, error }
}

// -----------------------------
// Formatting helpers
// -----------------------------
const fmt = {
    usd(n?: bigint | number, d = 0) {
        if (n === undefined) return '$—'
        const v = typeof n === 'bigint' ? Number(n) : n
        return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: d })
    },
    usdc(n?: bigint | number, decimals = 6) {
        if (n === undefined) return '—'
        const v = typeof n === 'bigint' ? Number(n) / 10 ** decimals : n
        return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
    }
}

// -----------------------------
// Page
// -----------------------------
export default function AppPage() {
    return <AppFunctional />
}

function AppFunctional() {
    const { address, wallet, connect, disconnect, error: walletErr } = useWallet()

    // State
    const [decimals, setDecimals] = useState<number>(6)
    const [tvl, setTvl] = useState<bigint>()
    const [userShares, setUserShares] = useState<bigint>()
    const [usdcBal, setUsdcBal] = useState<bigint>()
    const [amount, setAmount] = useState('1000')
    const [withdrawPct, setWithdrawPct] = useState(25)
    const [busy, setBusy] = useState(false)

    const hasConfig = useMemo(() => Boolean(VAULT_ADDR && USDC_ADDR), [])

    // Reads
    useEffect(() => {
        (async () => {
            if (!hasConfig) return
            try {
                const dec = await publicClient.readContract({ address: USDC_ADDR as `0x${string}`, abi: abiErc20, functionName: 'decimals' }) as number
                setDecimals(dec)
                const ta = await publicClient.readContract({ address: VAULT_ADDR as `0x${string}`, abi: abiVault, functionName: 'totalAssets' }) as bigint
                setTvl(ta)
                if (address) {
                    const [bal, shares] = await Promise.all([
                        publicClient.readContract({ address: USDC_ADDR as `0x${string}`, abi: abiErc20, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
                        publicClient.readContract({ address: VAULT_ADDR as `0x${string}`, abi: abiVault, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
                    ])
                    setUsdcBal(bal); setUserShares(shares)
                } else {
                    setUsdcBal(undefined); setUserShares(undefined)
                }
            } catch (e) {
                console.warn('read error', e)
            }
        })()
    }, [address, hasConfig])

    const connected = !!address

    // Actions
    const onDeposit = useCallback(async () => {
        if (!wallet || !connected || !hasConfig) return
        setBusy(true)
        try {
            const assets = parseUnits(amount || '0', decimals)
            const account = address as `0x${string}`
            const allowance = await publicClient.readContract({ address: USDC_ADDR as `0x${string}`, abi: abiErc20, functionName: 'allowance', args: [account, VAULT_ADDR as `0x${string}`] }) as bigint
            if (allowance < assets) {
                await wallet.writeContract({ 
                    account, 
                    address: USDC_ADDR as `0x${string}`, 
                    abi: abiErc20, 
                    functionName: 'approve', 
                    args: [VAULT_ADDR as `0x${string}`, assets],
                    chain: null
                } as never)
            }
            await wallet.writeContract({ 
                account, 
                address: VAULT_ADDR as `0x${string}`, 
                abi: abiVault, 
                functionName: 'deposit', 
                args: [assets, account],
                chain: null
            } as never)
        } finally {
            setBusy(false)
        }
    }, [wallet, connected, hasConfig, amount, decimals, address])

    const onWithdraw = useCallback(async () => {
        if (!wallet || !connected || !hasConfig || !userShares) return
        setBusy(true)
        try {
            const account = address as `0x${string}`
            const shares = (userShares * BigInt(withdrawPct)) / BigInt(100)
            await wallet.writeContract({ 
                account, 
                address: VAULT_ADDR as `0x${string}`, 
                abi: abiVault, 
                functionName: 'redeem', 
                args: [shares, account, account],
                chain: null
            } as never)
        } finally {
            setBusy(false)
        }
    }, [wallet, connected, hasConfig, userShares, withdrawPct, address])

    // Derived
    const tvlUsd = tvl
    const usdcDisplay = fmt.usdc(usdcBal, decimals)
    const sharesDisplay = userShares?.toString() ?? '—'

    return (
        <main className="min-h-screen bg-[#0B0D17] text-[#F8FAFC]">
            {/* bg accents */}
            <div className="pointer-events-none fixed inset-0 opacity-60" aria-hidden>
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[36rem] w-[80%] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,232,213,.18), transparent 60%)' }} />
                <div className="absolute top-1/3 right-10 h-64 w-64 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,.22), transparent 60%)' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-3">
                        <NetworkBadge />
                        {connected ? (
                            <AccountPill acct={{ address, usdc: usdcDisplay, shares: sharesDisplay }} onDisconnect={disconnect} />
                        ) : (
                            <ConnectButton onClick={connect} />
                        )}
                    </div>
                </header>

                {/* Hints & errors */}
                {!hasConfig && (
                    <div className="mt-4 text-sm text-[#94A3B8]">Set <code>NEXT_PUBLIC_VAULT_ADDRESS</code> and <code>NEXT_PUBLIC_USDC_ADDRESS</code> in <code>.env.local</code> to enable deposits/withdrawals.</div>
                )}
                {walletErr && (
                    <div className="mt-2 text-sm text-[#94A3B8]">{walletErr}</div>
                )}

                {/* Vault Summary */}
                <section className="mt-8 grid gap-4 md:grid-cols-4">
                    <Card>
                        <Label>TVL</Label>
                        <Value>{fmt.usd(tvlUsd)}</Value>
                    </Card>
                    <Card>
                        <Label>Projected APY</Label>
                        <Value>—%</Value>
                    </Card>
                    <Card>
                        <Label>Funding (daily)</Label>
                        <Value>— bps</Value>
                    </Card>
                    <Card>
                        <Label>Status</Label>
                        <div className="flex items-center gap-2"><HealthDot state="ok" /> <Value className="!mt-0">Healthy</Value></div>
                    </Card>
                </section>

                {/* Main grid */}
                <section className="mt-6 grid gap-6 lg:grid-cols-3">
                    {/* Left: Actions */}
                    <div className="space-y-6 lg:col-span-2">
                        <Tabs />
                        <div className="card p-6 bg-[#0F172A]/80 backdrop-blur border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">Deposit</h3>
                                <div className="text-sm text-[#94A3B8]">Asset: <span className="text-white">USDC</span> • Min 10 USDC</div>
                                <div className="mt-2">
                                    <AmountInput value={amount} onChange={setAmount} disabled={!connected || busy} />
                                    <div className="mt-3 flex items-center justify-between text-sm text-[#94A3B8]">
                                        <div>Wallet balance: {connected ? usdcDisplay : '—'}</div>
                                        <div className="flex gap-2">
                                            {[25, 50, 75, 100].map(p => (
                                                <Chip key={p} onClick={() => connected && usdcBal !== undefined && setAmount(((Number(usdcBal) / 10 ** decimals) * (p / 100)).toFixed(2))} disabled={!connected || busy}>{p}%</Chip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <PrimaryButton disabled={!connected || busy || !hasConfig} onClick={onDeposit}>{busy ? 'Working…' : 'Deposit'}</PrimaryButton>
                                {!connected && <Hint>Connect your wallet to deposit.</Hint>}
                            </div>
                        </div>

                        <div className="card p-6 bg-[#0F172A]/80 backdrop-blur border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">Withdraw</h3>
                                <div className="text-sm text-[#94A3B8]">Your shares: <span className="text-white">{connected ? sharesDisplay : '—'}</span></div>
                                <div className="mt-2">
                                    <Slider value={withdrawPct} onChange={setWithdrawPct} disabled={!connected || busy} />
                                    <div className="mt-3 flex items-center justify-between text-sm text-[#94A3B8]">
                                        <div>{withdrawPct}% of shares</div>
                                        <div>Est. proceeds: —</div>
                                    </div>
                                </div>
                                <PrimaryButton disabled={!connected || busy || !userShares || !hasConfig} onClick={onWithdraw}>{busy ? 'Working…' : 'Withdraw'}</PrimaryButton>
                            </div>
                        </div>
                    </div>

                    {/* Right: Health & Activity */}
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-1">Vault Health</h3>
                            <div className="text-sm text-[#94A3B8] mb-4">Delta exposure, rebalancing, and circuit breakers.</div>
                            <HealthMeter value={0.3} />
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#94A3B8]">
                                <div>Delta exposure</div>
                                <div className="text-right text-white">$0.3k</div>
                                <div>Next rebalance</div>
                                <div className="text-right text-white">in ~3h</div>
                                <div>Circuit breakers</div>
                                <div className="text-right"><CircuitPills /></div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
                            <div className="mt-3 space-y-3">
                                {[
                                    { t: 'Deposit', v: '+12,000 USDC', ts: '2h ago' },
                                    { t: 'Rebalance', v: 'Δ −$0.8k → $0.3k', ts: '5h ago' },
                                    { t: 'Funding sweep', v: '+ 22.1 bps', ts: '1d ago' },
                                ].map((x, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="text-sm">{x.t}</div>
                                        <div className="text-sm text-[#94A3B8]">{x.v} • {x.ts}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-2">Risk & Disclosures</h3>
                            <ul className="list-disc pl-6 text-[#94A3B8] space-y-1 text-sm">
                                <li>Funding can invert; returns may be negative.</li>
                                <li>Execution, oracle, venue, and smart contract risk.</li>
                                <li>Not available in restricted jurisdictions; KYC/AML may apply.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <footer className="mt-10 py-8 text-center text-sm text-[#94A3B8]">
                    © {new Date().getFullYear()} DeltaZero • Software only. Not an offer or solicitation.
                </footer>
            </div>
        </main>
    )
}

// -----------------------------
// UI atoms
// -----------------------------
function Logo() {
    return (
        <div className="flex items-center gap-3">
            <svg 
                width="32" 
                height="32" 
                viewBox="0 0 32 32" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
            >
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E8D5" />
                        <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" fill="url(#logoGradient)" opacity="0.2" />
                <path 
                    d="M16 8 L24 16 L16 24 L8 16 Z" 
                    fill="url(#logoGradient)" 
                    stroke="url(#logoGradient)" 
                    strokeWidth="1.5"
                />
                <circle cx="16" cy="16" r="3" fill="url(#logoGradient)" />
            </svg>
            <div className="text-xl font-bold">
                <span>Delta</span>
                <span className="bg-[linear-gradient(135deg,#00E8D5,#7C3AED)] bg-clip-text text-transparent">Zero</span>
            </div>
        </div>
    )
}

function NetworkBadge() {
    return (
        <div className="px-3 py-1 rounded-full border border-white/10 text-sm text-[#94A3B8] bg-[#0F172A]/70">Supra • Mainnet</div>
    )
}

function ConnectButton({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="h-10 px-4 rounded-2xl bg-[#00E8D5] text-[#0B0D17] font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:-translate-y-[1px] transition">
            Connect Wallet
        </button>
    )
}

function AccountPill({ acct, onDisconnect }: { acct: { address: string | undefined, usdc: string, shares: string }, onDisconnect: () => void }) {
    return (
        <div className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-[#0F172A]/80 border border-white/10">
            <div className="text-sm text-[#94A3B8]">{acct.address?.slice(0, 6)}…{acct.address?.slice(-4)}</div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-sm">{acct.usdc}</div>
            <button onClick={onDisconnect} className="ml-2 text-xs text-[#94A3B8] hover:text-white">Disconnect</button>
        </div>
    )
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="card p-4 bg-[#0F172A]/80 backdrop-blur border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
    return <div className="text-sm text-[#94A3B8]">{children}</div>
}

function Value({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={`mt-1 text-2xl font-bold ${className}`}>{children}</div>
}

function HealthDot({ state }: { state: 'ok' | 'warn' | 'halt' }) {
    const color = state === 'ok' ? '#00E8D5' : state === 'warn' ? '#C7F000' : '#F43F5E'
    return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
}

function Tabs() {
    const items = [
        { k: 'deposit', label: 'Deposit' },
        { k: 'withdraw', label: 'Withdraw' },
    ] as const
    return (
        <div className="flex gap-2">
            {items.map(x => (
                <span key={x.k} className={`h-10 px-4 rounded-2xl border bg-white/10 border-white/20 flex items-center`}>{x.label}</span>
            ))}
        </div>
    )
}

function AmountInput({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled?: boolean }) {
    return (
        <div className={`flex items-center rounded-2xl border border-white/10 bg-[#0B0D17] px-4 h-14 ${disabled ? 'opacity-60' : ''}`}>
            <input className="bg-transparent outline-none text-2xl w-full" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00" disabled={disabled} />
            <div className="ml-3 text-sm text-[#94A3B8]">USDC</div>
        </div>
    )
}

function Chip({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled} className={`px-3 py-1 rounded-full text-xs border ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'} border-white/10 text-[#94A3B8]`}>{children}</button>
    )
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode, disabled?: boolean, onClick?: () => void }) {
    return (
        <button onClick={onClick} disabled={disabled} className={`h-12 px-6 rounded-2xl font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition ${disabled ? 'bg-[#00E8D5]/40 text-[#0B0D17]/50 cursor-not-allowed' : 'bg-[#00E8D5] text-[#0B0D17] hover:-translate-y-[1px]'}`}>{children}</button>
    )
}

function Hint({ children }: { children: React.ReactNode }) {
    return <div className="text-sm text-[#94A3B8]">{children}</div>
}

function Slider({ value, onChange, disabled }: { value: number, onChange: (v: number) => void, disabled?: boolean }) {
    return (
        <div className={`py-2 ${disabled ? 'opacity-60' : ''}`}>
            <input type="range" min={1} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full" disabled={disabled} />
        </div>
    )
}

function HealthMeter({ value }: { value: number }) {
    const pct = Math.min(100, Math.max(0, (value / 5) * 100))
    const bar = `linear-gradient(90deg, #00E8D5 ${pct}%, rgba(255,255,255,.08) ${pct}%)`
    return (
        <div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full" style={{ background: bar }} />
            </div>
            <div className="mt-1 text-xs text-[#94A3B8]">Residual delta: ${value.toFixed(1)}k (lower is better)</div>
        </div>
    )
}

function CircuitPills() {
    const items = [
        { k: 'maxLev', label: 'Lev ≤ 2.5×', on: true },
        { k: 'fundFlip', label: 'Funding flip guard', on: true },
        { k: 'priceGap', label: 'Oracle gap', on: true },
        { k: 'paused', label: 'Paused', on: false },
    ]
    return (
        <div className="flex flex-wrap gap-2 justify-end">
            {items.map(x => (
                <span key={x.k} className={`px-2 py-0.5 rounded-full text-[11px] border ${x.on ? 'border-[#00E8D5]/40 text-[#00E8D5]' : 'border-white/10 text-[#94A3B8]'}`}>{x.label}</span>
            ))}
        </div>
    )
}

// -----------------------------
// Dev-only sanity tests (run in dev; safe in prod)
// -----------------------------
try {
    const proc = process as ProcessEnv
    if (typeof process !== 'undefined' && proc.env?.NODE_ENV !== 'production') {
        // Test: missing key returns undefined
        console.assert(readPublicEnv('___MISSING___') === undefined, 'env: missing should be undefined')
        // Test: runtime window injection works
        const g = globalThis as GlobalEnv
        g.__ENV__ = { TEST_KEY: 'ok' }
        console.assert(readPublicEnv('TEST_KEY') === 'ok', 'env: window.__ENV__ fallback should work')
    }
} catch { }

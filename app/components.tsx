import { Link } from '@remix-run/react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Fragment } from 'react';
import { useState } from 'react';

export function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-md">
			{children}
		</span>
	);
}

export function Attribute({
	name,
	type,
	knownValues,
}: { name: string; type: string; knownValues: any[] }) {
	return (
		<div className="flex flex-col border shadow p-2 rounded">
			<div className="flex items-center gap-2">
				<Badge>{name}</Badge>
				<Badge>{type}</Badge>
			</div>
			<div className="text-xs overflow-hidden line-clamp-1">
				{knownValues.map((value, index) => {
					return <div key={index}>{value.value}</div>;
				})}
			</div>
		</div>
	);
}

export function Row({
	row,
	expanded: expandedDefault,
	parent,
}: { row: any; expanded?: boolean; parent?: any }) {
	const [expanded, setExpanded] = useState(expandedDefault);
	// expanded = false;

	return (
		<motion.div
			className="flex flex-col border shadow p-2 rounded min-w-0 w-full group"
			layout="position"
			layoutId={row.id}
			initial={{
				opacity: 0,
			}}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<div className="flex items-center gap-2">
				<PrettyLink to={`/${row.id}`} className="font-bold truncate">
					{row.id}
				</PrettyLink>
				<Badge>{row.type}</Badge>
				<Badge>{row.subtype}</Badge>
				{row.children_count ? (
					<Badge>Children: {row.children_count}</Badge>
				) : null}
				{row.timestamp && <Badge>{row.timestamp}</Badge>}
				{parent && (
					<span className="text-xs text-gray-500">
						Parent: <PrettyLink to={`/${parent.id}`}>{parent.id}</PrettyLink>
					</span>
				)}

				<div className="flex-1" />
				<button
					type="button"
					onClick={() => setExpanded((expanded) => !expanded)}
					className="text-xs text-blue-700 hover:underline"
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			</div>

			{/* Superceded by breadcrumb? */}
			{/* {showParent && (
				<div>
					Parent:{' '}
					<PrettyLink to={`/${row.parent ?? ''}`}>
						{row.parent ?? '(root)'}
					</PrettyLink>
				</div>
			)} */}
			{expanded ? (
				<pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap mt-2 text-xs">
					{JSON.stringify(row.json, null, 2)}
				</pre>
			) : (
				<button
					type="button"
					className="text-xs overflow-hidden line-clamp-2 group-hover:underline cursor-pointer text-left"
					onClick={() => setExpanded(true)}
				>
					<div>{JSON.stringify(row.json)}</div>
				</button>
			)}
		</motion.div>
	);
}

export function Breadcrumb({ breadcrumb }: { breadcrumb: string[] }) {
	return (
		<div className="flex items-center gap-1">
			{[...breadcrumb].reverse().map((id, index) => (
				<Fragment key={id}>
					<PrettyLink
						className={clsx(
							index === 0 && 'font-bold',
							'truncate max-w-[100px]',
						)}
						to={`/${id}`}
					>
						{id ?? '(root)'}
					</PrettyLink>
					{index < breadcrumb.length - 1 && ' > '}
				</Fragment>
			))}
		</div>
	);
}

export function PrettyLink({
	to,
	children,
	className,
}: { to: string; children: React.ReactNode; className?: string }) {
	return (
		<Link className={clsx('text-blue-700 hover:underline', className)} to={to}>
			{children}
		</Link>
	);
}

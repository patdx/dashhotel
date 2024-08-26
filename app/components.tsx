import { Link } from '@remix-run/react';
import clsx from 'clsx';
import { Fragment } from 'react';

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
	showParent,
}: { row: any; expanded?: boolean; showParent?: boolean }) {
	const [expanded, setExpanded] = useState(expandedDefault);

	return (
		<div className="flex flex-col border shadow p-2 rounded">
			<div className="flex items-center gap-2">
				<Breadcrumb breadcrumb={[null, ...row.breadcrumb]} />
				{/* <PrettyLink to={`/${row.id}`}>{row.id}</PrettyLink> */}
				<Badge>{row.type}</Badge>
				<Badge>{row.subtype}</Badge>
				{row.children_count ? (
					<Badge>Children: {row.children_count}</Badge>
				) : null}
				{row.timestamp && <Badge>{row.timestamp}</Badge>}

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
				<div className="text-xs overflow-hidden line-clamp-2">
					{JSON.stringify(row.json)}
				</div>
			)}
		</div>
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

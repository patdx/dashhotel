'use client';

import { Filter, X } from 'lucide-react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import type { schema } from '~/.server/db';
import { Badge } from '~/components';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table';
import { dashboardState } from './state';

// Mock data for logs
const mockLogs = [
	{
		id: 1,
		date: '2023-06-01 10:30:15',
		url: '/api/users',
		response_time: 250,
		error: 'Internal Server Error',
		details: { message: 'Database connection failed', code: 'ERR_DB_CONN' },
	},
	{
		id: 2,
		date: '2023-06-01 11:45:22',
		url: '/api/products',
		response_time: 150,
		error: 'Not Found',
		details: { message: 'Product ID does not exist', code: 'ERR_NOT_FOUND' },
	},
	{
		id: 3,
		date: '2023-06-02 09:15:03',
		url: '/api/orders',
		response_time: 350,
		error: 'Bad Request',
		details: { message: 'Invalid order data', code: 'ERR_INVALID_DATA' },
	},
	{
		id: 4,
		date: '2023-06-02 14:20:45',
		url: '/api/auth',
		response_time: 100,
		error: 'Unauthorized',
		details: { message: 'Invalid token', code: 'ERR_INVALID_TOKEN' },
	},
	{
		id: 5,
		date: '2023-06-03 16:55:30',
		url: '/api/payments',
		response_time: 300,
		error: 'Gateway Timeout',
		details: {
			message: 'Payment provider not responding',
			code: 'ERR_GATEWAY_TIMEOUT',
		},
	},
];

// Mock data for filter attributes
const filterAttributes = [
	{ name: 'url', type: 'string' },
	{ name: 'response_time', type: 'number' },
	{ name: 'error', type: 'string' },
];

type Attribute = {
	type: string;
	key: string;
	known_values: {
		key: string;
		value: string;
	}[];
};

export function NewDashboard({
	logs = [],
	attributes = [],
}: {
	logs: (typeof schema.row.$inferSelect)[];
	attributes: Attribute[];
}) {
	const [_logs, setLogs] = useState(mockLogs);
	const [filterAttribute, setFilterAttribute] = useState('');
	const [filterValue, setFilterValue] = useState('');
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const applyFilter = () => {
		if (!filterAttribute || !filterValue) {
			setLogs(mockLogs);
			return;
		}

		const filteredLogs = mockLogs.filter((log) => {
			if (filterAttribute === 'response_time') {
				return log[filterAttribute] <= Number.parseInt(filterValue);
			}
			return log[filterAttribute]
				.toLowerCase()
				.includes(filterValue.toLowerCase());
		});

		setLogs(filteredLogs);
	};

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="flex h-screen bg-gray-100 dark:bg-gray-900">
			{/* Main content */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex justify-between items-center">
						<h1 className="text-2xl font-bold">Error Tracking Dashboard</h1>
						<div className="flex items-center space-x-4">
							{/* <div className="flex items-center">
								<AlertCircle className="text-red-500 mr-2" />
								<span className="font-semibold">{logs.length} Errors</span>
							</div> */}
							<Button variant="outline" onClick={toggleSidebar}>
								<Filter className="mr-2 h-4 w-4" /> Filters
							</Button>
						</div>
					</div>
				</header>

				{/* Log table */}
				<ScrollArea className="flex-1 p-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Labels</TableHead>
								<TableHead>Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.map((log) => (
								<LogRow key={log.id} log={log} />
							))}
						</TableBody>
					</Table>
				</ScrollArea>
			</div>

			{/* Sidebar */}
			{isSidebarOpen && (
				<div
					className={`w-64 bg-white dark:bg-gray-800 p-4 border-l border-gray-200 dark:border-gray-700`}
				>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-lg font-semibold">Filters</h2>
						<Button variant="ghost" size="sm" onClick={toggleSidebar}>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<div className="space-y-4">
						<div>
							<Label htmlFor="filterAttribute">Attribute</Label>
							<Select onValueChange={setFilterAttribute}>
								<SelectTrigger id="filterAttribute">
									<SelectValue placeholder="Select attribute" />
								</SelectTrigger>
								<SelectContent>
									{attributes.map((attr) => (
										<SelectItem key={attr.key} value={attr.key}>
											{attr.key} ({attr.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="filterValue">Value</Label>
							<Input
								id="filterValue"
								placeholder="Filter value"
								value={filterValue}
								onChange={(e) => setFilterValue(e.target.value)}
							/>
						</div>
						<Button onClick={applyFilter} className="w-full">
							Apply Filter
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

const LogRow = observer(function LogRow({
	log,
}: { log: typeof schema.row.$inferSelect }) {
	const isExpanded = dashboardState.highlightedLogId === log.id;

	return (
		<TableRow key={log.id}>
			<TableCell>{log.timestamp}</TableCell>
			<TableCell>
				<div className="flex flex-wrap gap-2">
					<Badge>{log.type}</Badge>
					<Badge>{log.subtype}</Badge>
				</div>
			</TableCell>
			<TableCell>
				{isExpanded ? (
					<div className="text-xs min-w-0 break-all max-w-[600px] whitespace-pre-wrap">
						{JSON.stringify(log.json, null, 2)}
					</div>
				) : (
					<button
						type="button"
						onClick={action(() => {
							dashboardState.highlightedLogId = log.id;
						})}
						className="text-xs min-w-0 overflow-hidden line-clamp-2 break-all max-w-[600px]"
					>
						{JSON.stringify(log.json)}
					</button>
				)}
			</TableCell>

			{/* <TableCell>
				<Button variant="ghost" size="sm">
					View <ChevronDown className="ml-2 h-4 w-4" />
				</Button>
			</TableCell> */}
		</TableRow>
	);
});

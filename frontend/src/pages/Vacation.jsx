import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Check, X as CloseIcon, Plus } from 'lucide-react';
import clsx from 'clsx';
import useAuthStore from '../store/authStore';
import { vacationApi } from '../api/requests';

export default function Vacation() {
    const { user } = useAuthStore();
    const isAdminOrLeitung = user?.app_role === 'admin' || user?.app_role === 'leitung';

    const [activeTab, setActiveTab] = useState('my_requests'); // 'my_requests', 'new_request', 'admin_approvals'
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    // Form State
    const [formData, setFormData] = useState({ date_from: '', date_to: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await vacationApi.getRequests();
            setRequests(data);
        } catch (error) {
            console.error('Fehler beim Laden der Urlaubsanträge', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        if (isAdminOrLeitung) {
            setActiveTab('admin_approvals');
        }
    }, [isAdminOrLeitung]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (new Date(formData.date_from) > new Date(formData.date_to)) {
            setFormError('Enddatum darf nicht vor dem Startdatum liegen.');
            return;
        }

        setSubmitting(true);
        try {
            await vacationApi.createRequest(formData);
            setFormData({ date_from: '', date_to: '', notes: '' });
            setActiveTab('my_requests');
            fetchRequests();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Fehler beim Senden des Antrags.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await vacationApi.updateStatus(id, status);
            fetchRequests(); // reload
        } catch (err) {
            alert('Fehler beim Aktualisieren des Status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Antrag wirklich zurückziehen?')) {
            try {
                await vacationApi.deleteRequest(id);
                fetchRequests();
            } catch (err) {
                alert('Fehler beim Löschen des Antrags');
            }
        }
    };

    const StatusBadge = ({ status }) => {
        return (
            <span className={clsx(
                "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border",
                status === 'genehmigt' ? "bg-green-100 text-green-800 border-green-200" :
                    status === 'abgelehnt' ? "bg-red-100 text-red-800 border-red-200" :
                        "bg-yellow-100 text-yellow-800 border-yellow-200"
            )}>
                {status}
            </span>
        );
    };

    // Gefilterte Listen
    const myRequests = requests.filter(r => r.user_id === user.id);
    const pendingAdminRequests = requests.filter(r => r.status === 'ausstehend' && r.user_id !== user.id);
    const historyAdminRequests = requests.filter(r => r.status !== 'ausstehend' && r.user_id !== user.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-text">Urlaubsplaner</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-brand-border flex gap-2 w-full overflow-x-auto">
                {isAdminOrLeitung && (
                    <button
                        onClick={() => setActiveTab('admin_approvals')}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors relative",
                            activeTab === 'admin_approvals' ? "bg-brand-primary text-white" : "text-brand-text-sec hover:bg-gray-50 hover:text-brand-text"
                        )}
                    >
                        Anträge zur Freigabe
                        {pendingAdminRequests.length > 0 && (
                            <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {pendingAdminRequests.length}
                            </span>
                        )}
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('my_requests')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                        activeTab === 'my_requests' ? "bg-brand-primary text-white" : "text-brand-text-sec hover:bg-gray-50 hover:text-brand-text"
                    )}
                >
                    Meine Anträge
                </button>
                <button
                    onClick={() => setActiveTab('new_request')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2",
                        activeTab === 'new_request' ? "bg-brand-primary text-white" : "text-brand-text-sec hover:bg-gray-50 hover:text-brand-text"
                    )}
                >
                    <Plus className="w-4 h-4" /> Neuer Antrag
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    </div>
                ) : (
                    <div className="p-6">

                        {/* TAB: Neuer Antrag */}
                        {activeTab === 'new_request' && (
                            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
                                <h2 className="text-lg font-bold text-brand-text mb-4 border-b pb-2">Urlaub beantragen</h2>

                                {formError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                                        {formError}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-text mb-1">Erster Urlaubstag</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_from}
                                            onChange={e => setFormData({ ...formData, date_from: e.target.value })}
                                            className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-text mb-1">Letzter Urlaubstag</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_to}
                                            onChange={e => setFormData({ ...formData, date_to: e.target.value })}
                                            className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Notizen / Kommentar (Optional)</label>
                                    <textarea
                                        rows="3"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                        placeholder="Wichtige Hinweise für die Planung..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark font-medium transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Sende...' : 'Antrag einreichen'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB: Meine Anträge */}
                        {activeTab === 'my_requests' && (
                            <div>
                                <h2 className="text-lg font-bold text-brand-text mb-6">Meine gestellten Urlaubsanträge</h2>

                                {myRequests.length === 0 ? (
                                    <div className="text-center text-brand-text-sec py-12">
                                        Du hast noch keinen Urlaub beantragt.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myRequests.map(req => (
                                            <div key={req.id} className="border border-brand-border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-primary/50 transition-colors">
                                                <div>
                                                    <p className="font-semibold text-brand-text flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-brand-text-sec" />
                                                        {format(new Date(req.date_from), 'dd.MM.yyyy')} – {format(new Date(req.date_to), 'dd.MM.yyyy')}
                                                    </p>
                                                    {req.notes && <p className="text-sm text-gray-500 mt-1">{req.notes}</p>}
                                                    <p className="text-xs text-brand-text-sec mt-2">
                                                        Eingereicht am: {format(new Date(req.created_at), 'dd.MM.yyyy HH:mm')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <StatusBadge status={req.status} />
                                                    {req.status === 'ausstehend' && (
                                                        <button
                                                            onClick={() => handleDelete(req.id)}
                                                            className="text-red-500 hover:text-red-700 text-sm py-1 px-2 rounded hover:bg-red-50"
                                                            title="Antrag zurückziehen"
                                                        >
                                                            Zurückziehen
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: Admin Freigabe */}
                        {activeTab === 'admin_approvals' && isAdminOrLeitung && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-lg font-bold text-brand-text mb-4 text-yellow-600 flex items-center gap-2">
                                        Ausstehende Freigaben
                                    </h2>
                                    {pendingAdminRequests.length === 0 ? (
                                        <p className="text-sm text-gray-500">Keine offenen Anträge vorhanden.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingAdminRequests.map(req => (
                                                <div key={req.id} className="border-l-4 border-yellow-400 bg-yellow-50/30 rounded-r-lg p-4 flex flex-col sm:flex-row justify-between gap-4 border-y border-r border-brand-border shadow-sm">
                                                    <div>
                                                        <p className="font-bold text-brand-text">{req.user?.name}</p>
                                                        <p className="text-sm text-brand-text font-medium mt-1">
                                                            {format(new Date(req.date_from), 'dd.MM.yyyy')} – {format(new Date(req.date_to), 'dd.MM.yyyy')}
                                                        </p>
                                                        {req.notes && <p className="text-sm text-gray-600 mt-1 italic">"{req.notes}"</p>}
                                                        <p className="text-xs text-gray-500 mt-2">Team: {req.user?.team || '-'} • Rolle: {req.user?.role}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleStatusUpdate(req.id, 'abgelehnt')}
                                                            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 bg-white rounded-md hover:bg-red-50 text-sm font-medium transition-colors"
                                                        >
                                                            <CloseIcon className="w-4 h-4" /> Ablehnen
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(req.id, 'genehmigt')}
                                                            className="flex items-center gap-1 px-3 py-1.5 border border-green-200 text-green-700 bg-green-50 rounded-md hover:bg-green-100 text-sm font-medium transition-colors shadow-sm"
                                                        >
                                                            <Check className="w-4 h-4" /> Genehmigen
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {historyAdminRequests.length > 0 && (
                                    <div className="pt-6 border-t border-brand-border">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Bereits bearbeitete Anträge</h3>
                                        <div className="space-y-3 opacity-75">
                                            {historyAdminRequests.map(req => (
                                                <div key={req.id} className="flex justify-between items-center bg-gray-50 border border-brand-border rounded-lg p-3 text-sm">
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-medium w-32 truncate">{req.user?.name}</span>
                                                        <span className="text-gray-600">
                                                            {format(new Date(req.date_from), 'dd.MM.')} - {format(new Date(req.date_to), 'dd.MM.yyyy')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <StatusBadge status={req.status} />
                                                        <span className="text-xs text-gray-400 w-32 text-right truncate">
                                                            von {req.reviewer?.name || 'System'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}

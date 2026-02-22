import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../services/authService';
import { userService } from '../services/userService';
import { UserRole } from '../types';
import { toast } from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const queryClient = useQueryClient();

  // Fetch Users via Service
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
    enabled: !!currentUser
  });

  // Update Role Mutation via Service
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: UserRole }) => userService.updateUserRole(id, role),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['users'] });
       toast.success("User role updated successfully");
    },
    onError: (err: any) => {
       console.error(err);
       toast.error("Failed to update role. Ensure you have Admin privileges.");
    }
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
           <p className="text-gray-500 text-sm mt-1">Manage system access and client accounts.</p>
        </div>
        {!isAdmin && (
           <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">View Only Mode</span>
        )}
      </div>
      
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                 {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-100">
               {users?.map(user => (
                 <tr key={user.id} className="hover:bg-gray-50/80 transition group">
                   <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                         <div className="h-8 w-8 rounded-full bg-sey-blue/10 flex items-center justify-center text-sey-blue font-bold text-xs mr-3">
                            {user.name?.substring(0,2).toUpperCase()}
                         </div>
                         <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin && currentUser.id !== user.id ? (
                          <select 
                            value={user.role}
                            onChange={(e) => {
                                if(window.confirm(`Change ${user.name}'s role to ${e.target.value}?`)) {
                                    updateRoleMutation.mutate({ id: user.id, role: e.target.value as UserRole });
                                }
                            }}
                            className="text-xs font-semibold rounded-full px-2 py-1 border-gray-300 focus:ring-sey-blue focus:border-sey-blue cursor-pointer bg-gray-50"
                          >
                             <option value={UserRole.CLIENT}>CLIENT</option>
                             <option value={UserRole.MANAGER}>MANAGER</option>
                             <option value={UserRole.ADMIN}>ADMIN</option>
                          </select>
                      ) : (
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full 
                          ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                   </td>
                   {isAdmin && (
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       {currentUser.id !== user.id && (
                         <div className="flex justify-end space-x-2">
                           <span className="text-gray-300 text-xs italic">Manage via Role</span>
                         </div>
                       )}
                       {currentUser.id === user.id && (
                           <span className="text-gray-300 text-xs italic">Current User</span>
                       )}
                     </td>
                   )}
                 </tr>
               ))}
               {users?.length === 0 && (
                   <tr>
                       <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No users found.</td>
                   </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
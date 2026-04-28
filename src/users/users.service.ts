import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

    private readonly users = [
        { id: 1, name: 'John DoeAAA', email: 'john.doe@example.com' , role: 'ADMIN'},
        { id: 2, name: 'Jane Doe', email: 'jane.doe@example.com' , role: 'USER'},
        { id: 3, name: 'Ahmet Kılıç', email: 'ahmet.kilic@example.com', role: 'USER' },
        { id: 4, name: 'Hasan', email: 'hasan@example.com', role: 'USER' },
        { id: 5, name: 'Tris', email: 'tris@example.com', role: 'GUEST' }
    ];

    findAll(role?: string) {
        if (role) {
            const roleUsers = this.users.filter(user => user.role === role);
            if (roleUsers.length === 0) {
                throw new NotFoundException(`No users found with role ${role}`);
            }
            return roleUsers;
        }
        return this.users;
    }

    findOne(id: number) {
        const user = this.users.find(user => user.id === id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    create(user: CreateUserDto) {
        const newUser = { id: this.users.length + 1, ...user };
        this.users.push(newUser);
        return newUser;
    }

    update(id: number, user: UpdateUserDto) {
        const existingUser = this.findOne(id);
        if (existingUser) {
            Object.assign(existingUser, user);
            return existingUser;
        }
        return null;
    }

    delete(id: number) {
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
            return this.users.splice(index, 1)[0];
        }
        return null;
    }
}

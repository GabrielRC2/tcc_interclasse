// LINHA ~1-5, VERIFICAR SE TEM TODOS OS IMPORTS:

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Settings, Trophy, Calendar, FileText, Menu, X, Moon, Sun } from 'lucide-react'; // ADICIONAR Users se não tiver

const navigationItems = [
  { name: 'Dashboard', path: '/admin', icon: BarChart3 },
  { name: 'Times', path: '/admin/teams', icon: Users },
  { name: 'Cadastros', path: '/admin/registrations', icon: Settings },
  { name: 'Torneios', path: '/admin/seasons', icon: Trophy },
  { name: 'Grupos', path: '/admin/groups', icon: Users }, // ADICIONAR ESTA LINHA
  { name: 'Partidas', path: '/admin/matches', icon: Calendar },
  { name: 'Inscrições', path: '/admin/entries', icon: FileText }
];
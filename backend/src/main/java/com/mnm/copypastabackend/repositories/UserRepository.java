package com.mnm.copypastabackend.repositories;

import java.util.List;
import java.util.Optional;

import com.mnm.copypastabackend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    public Optional<User> findByName(String name);

    public List<User> findAllByOrderByIdDesc();
}
